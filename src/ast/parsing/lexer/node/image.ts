import { TokenParser, TokenPredicate } from '../struct';
import { Token, TokenType } from '../../tokenizer';
import {
    ImageNode,
    Node,
    NodeType,
    RawNodeType,
    TextNode,
} from '../../../node';
import { applyVisitors } from '../index';
import {
    DiagnoseErrorType,
    DiagnoseList,
    DiagnoseSeverity,
    nodesToDiagnose,
} from '../../../../diagnose';
import { getMacroArgs, getMacroLabel } from './macros';

export const isImage: TokenPredicate = function (token, index, node) {
    if (!(token.type === TokenType.SeparatedSpecial && token.text === '!')) {
        return false;
    }

    const bracketToken: Token | null = node.tokens[index + 1] ?? null;
    return (
        bracketToken?.type === TokenType.SeparatedSpecial &&
        bracketToken?.text === '['
    );
};

interface ConvertMetricResult {
    result?: string;
    diagnostic: DiagnoseList;
}

function convertMetric(nodes: Node[]): ConvertMetricResult {
    // nodes = nodes
    //     .filter(
    //         n =>
    //             n.type !== NodeType.Text ||
    //             (n as TextNode).text.trim().length !== 0,
    //     )
    //     .flatMap(n => (n.type === RawNodeType.SoftBreak ? [] : [n]));

    if (nodes.length === 0) {
        return {
            diagnostic: [],
        };
    }

    if (!(nodes.length === 1 && nodes[0].type === NodeType.Text)) {
        return {
            diagnostic: [
                nodesToDiagnose(
                    nodes,
                    DiagnoseSeverity.Error,
                    DiagnoseErrorType.ApplyParserError,
                    'Metric argument must be a text without spaces',
                ),
            ],
        };
    }

    const textNode = nodes[0] as TextNode;
    return {
        result: textNode.text,
        diagnostic: [],
    };
}

interface ParseImageArgumentsResult {
    result: {
        width?: string;
        height?: string;
        name?: Node[];
    };
    diagnostic: DiagnoseList;
}

function parseImageArguments(
    posArgs: Node[][],
    keyArgs: Record<string, Node[]>,
): ParseImageArgumentsResult {
    const diagnostic: DiagnoseList = [];
    const result: ParseImageArgumentsResult['result'] = {};

    if (posArgs[0]) {
        // Name

        result.name = posArgs[0];
        // TODO: encapsulate
    }
    if (posArgs[1]) {
        // Width

        const metric = convertMetric(posArgs[1]);
        diagnostic.push(...metric.diagnostic);
        result.width = metric.result;
    }
    if (posArgs[2]) {
        // Height

        const metric = convertMetric(posArgs[2]);
        diagnostic.push(...metric.diagnostic);
        result.height = metric.result;
    }

    if (posArgs.length > 3) {
        for (let i = 3; i < posArgs.length; ++i) {
            diagnostic.push(
                nodesToDiagnose(
                    posArgs[i],
                    DiagnoseSeverity.Error,
                    DiagnoseErrorType.ApplyParserError,
                    `Unexpected positional image argument ${i}`,
                ),
            );
        }
    }

    const keys: string[] = Object.keys(keyArgs);
    if (!result.name) {
        const nameKeyNames = ['n', 'name'];
        for (const name of nameKeyNames) {
            const index = keys.indexOf(name);
            if (index !== -1) {
                keys.splice(index, 1);
                result.name = keyArgs[name];
                break;
            }
        }

        // TODO: encapsulate
    }
    if (!result.width) {
        const nameKeyNames = ['w', 'width'];
        for (const name of nameKeyNames) {
            const index = keys.indexOf(name);
            if (index !== -1) {
                keys.splice(index, 1);
                const metric = convertMetric(keyArgs[name]);
                diagnostic.push(...metric.diagnostic);
                result.width = metric.result;
                break;
            }
        }
    }
    if (!result.height) {
        const nameKeyNames = ['h', 'height'];
        for (const name of nameKeyNames) {
            const index = keys.indexOf(name);
            if (index !== -1) {
                keys.splice(index, 1);
                const metric = convertMetric(keyArgs[name]);
                diagnostic.push(...metric.diagnostic);
                result.height = metric.result;
                break;
            }
        }
    }

    for (const key of keys) {
        diagnostic.push(
            nodesToDiagnose(
                keyArgs[key],
                DiagnoseSeverity.Error,
                DiagnoseErrorType.ApplyParserError,
                `Unexpected key image argument ${key}`,
            ),
        );
    }

    return {
        result,
        diagnostic,
    };
}

export const parseImage: TokenParser = function (tokens, index) {
    const token = tokens.tokens[index];
    if (!isImage(token, index, tokens)) {
        return null;
    }

    const diagnostic: DiagnoseList = [];
    const labelResult = getMacroLabel(tokens, index + 1);

    const label = labelResult.label;
    if (!label) {
        return null; // TODO: diagnostic error
    }

    diagnostic.push(...labelResult.diagnostic);

    const macroArgsResult = getMacroArgs(tokens, labelResult.index);
    diagnostic.push(...macroArgsResult.diagnostic);

    if (macroArgsResult.posArgs.length === 0) {
        return null; // TODO: diagnostic error
    }
    const imageUrl = macroArgsResult.posArgs.splice(0, 1)[0];

    const parsePosArgs: Node[][] = macroArgsResult.posArgs.map(n => {
        const result = applyVisitors([n]);
        diagnostic.push(...result.diagnostic);
        return result.nodes;
    });
    const parseKeyArgs: Record<string, Node[]> = Object.fromEntries(
        Object.entries(macroArgsResult.keyArgs).map(([k, v]) => {
            const result = applyVisitors([v]);
            diagnostic.push(...result.diagnostic);

            return [k, result.nodes];
        }),
    );

    const imageInfo = parseImageArguments(parsePosArgs, parseKeyArgs);
    diagnostic.push(...imageInfo.diagnostic);

    const endToken = tokens.tokens[macroArgsResult.index - 1];
    const imageNode: ImageNode = {
        type: NodeType.Image,
        pos: {
            start: token.pos,
            end: endToken.pos + endToken.text.length,
        },
        parent: tokens.parent,
        text: label,
        href: imageUrl.text,
        ...imageInfo.result,
    };

    imageInfo.result.name?.forEach(v => (v.parent = imageNode));

    return {
        nodes: [imageNode],
        index: macroArgsResult.index,
        diagnostic: diagnostic,
    };
};
