import {
    Node,
    NodeArgs,
    NodeType,
    OpCodeNode,
    TextNode,
    TokensNode,
} from '../ast/node';
import {
    DiagnoseErrorType,
    DiagnoseList,
    DiagnoseSeverity,
    nodesToDiagnose,
    nodeToDiagnose,
} from '../diagnose';

export const enum ArgInfoType {
    NodeArray = 'NodeArray',
    Text = 'Text',
}

export interface ArgInfo {
    name: string;
    aliases: string[];
    type: ArgInfoType;
    optional: boolean;
}

export type ParsedMacrosArguments = Record<string, Node[] | string | null>;

export interface ParseMacrosArgumentsResult {
    result: ParsedMacrosArguments;
    diagnostic: DiagnoseList;
}

interface _ArgInfoTypeType {
    [ArgInfoType.NodeArray]: Node[];
    [ArgInfoType.Text]: string;
}

interface ConvertArgumentTypeResult<T extends ArgInfoType> {
    result: _ArgInfoTypeType[T];
    diagnostic: DiagnoseList;
}

const argumentConverter: {
    [key in ArgInfoType]: (nodes: Node[]) => ConvertArgumentTypeResult<key>;
} = {
    [ArgInfoType.NodeArray]: nodes => ({ result: nodes, diagnostic: [] }),

    [ArgInfoType.Text]: nodes => {
        if (nodes.length === 0) {
            return {
                result: '',
                diagnostic: [],
            };
        }

        if (!(nodes.length === 1 && nodes[0].type === NodeType.Text)) {
            return {
                result: '',
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
    },
};

export function convertArgumentType<T extends ArgInfoType>(
    argument: Node[],
    type: T,
): ConvertArgumentTypeResult<T> {
    return argumentConverter[type](argument);
}

export function parseMacrosArguments(
    node: Node & NodeArgs,
    argsInfo: ArgInfo[],
): ParseMacrosArgumentsResult {
    const diagnostic: DiagnoseList = [];
    const result: ParseMacrosArgumentsResult['result'] = {};

    for (let i = 0; i < Math.min(node.posArgs.length, argsInfo.length); ++i) {
        const info = argsInfo[i];
        const convertResult = convertArgumentType(node.posArgs[i], info.type);
        diagnostic.push(...convertResult.diagnostic);
        result[info.name] = convertResult.result;
    }

    for (let i = argsInfo.length; i < node.posArgs.length; ++i) {
        diagnostic.push(
            nodesToDiagnose(
                node.posArgs[i],
                DiagnoseSeverity.Error,
                DiagnoseErrorType.ApplyParserError,
                `Unexpected positional image argument ${i}`,
            ),
        );
    }

    const keys: string[] = Object.keys(node.keyArgs);
    for (const info of argsInfo) {
        const aliasIndex = info.aliases.findIndex(
            alias => keys.indexOf(alias) !== -1,
        );
        const nameIndex = keys.indexOf(info.name);

        const index = nameIndex !== -1 ? nameIndex : aliasIndex;
        if (index === -1) {
            continue;
        }

        const key = keys.splice(index, 1)[0];
        if (result[info.name]) {
            diagnostic.push(
                nodesToDiagnose(
                    node.keyArgs[key],
                    DiagnoseSeverity.Warning,
                    DiagnoseErrorType.ApplyParserError,
                    `Argument ${key} specified twice`,
                ),
            );
        }

        const convertResult = convertArgumentType(node.keyArgs[key], info.type);
        diagnostic.push(...convertResult.diagnostic);
        result[info.name] = convertResult.result;
    }

    for (const key of keys) {
        diagnostic.push(
            nodesToDiagnose(
                node.keyArgs[key],
                DiagnoseSeverity.Warning,
                DiagnoseErrorType.ApplyParserError,
                `Unexpected key argument ${key}`,
            ),
        );
    }

    for (const info of argsInfo) {
        if (info.optional || info.name in result) {
            continue;
        }

        diagnostic.push(
            nodeToDiagnose(
                node,
                DiagnoseSeverity.Error,
                DiagnoseErrorType.ApplyParserError,
                `Expected argument ${info.name}`,
            ),
        );
    }

    return {
        result,
        diagnostic,
    };
}
