import {
    Node,
    NodeArgs,
    NodeType,
    SPAN_NODE_TYPES,
    TextNode,
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
    onlySpans: boolean; // No block nodes
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
    [key in ArgInfoType]: (
        nodes: Node[],
        info: ArgInfo,
    ) => ConvertArgumentTypeResult<key>;
} = {
    [ArgInfoType.NodeArray]: (nodes, info) => {
        const diagnostic: DiagnoseList = [];
        if (info.onlySpans) {
            diagnostic.push(
                ...nodes
                    .filter(
                        n => SPAN_NODE_TYPES.indexOf(n.type as NodeType) === -1,
                    )
                    .map(n =>
                        nodeToDiagnose(
                            n,
                            DiagnoseSeverity.Error,
                            DiagnoseErrorType.MacrosError,
                            `Cannot use non-span nodes at argument ${info.name}`,
                        ),
                    ),
            );
        }

        return { result: nodes, diagnostic: diagnostic };
    },

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
    info: ArgInfo,
    argument: Node[],
    type: T,
): ConvertArgumentTypeResult<T> {
    return argumentConverter[type](argument, info);
}

export function parseMacrosArguments(
    node: Node & NodeArgs,
    argsInfo: ArgInfo[],
): ParseMacrosArgumentsResult {
    const diagnostic: DiagnoseList = [];
    const result: ParseMacrosArgumentsResult['result'] = {};

    for (let i = 0; i < Math.min(node.posArgs.length, argsInfo.length); ++i) {
        const info = argsInfo[i];
        const convertResult = convertArgumentType(
            info,
            node.posArgs[i],
            info.type,
        );
        diagnostic.push(...convertResult.diagnostic);
        result[info.name] = convertResult.result;
    }

    for (let i = argsInfo.length; i < node.posArgs.length; ++i) {
        const posArgNodes = node.posArgs[i];
        diagnostic.push(
            nodesToDiagnose(
                posArgNodes.length === 0 ? [node] : posArgNodes,
                DiagnoseSeverity.Error,
                DiagnoseErrorType.ApplyParserError,
                `Unexpected positional image argument ${i}`,
            ),
        );
    }

    const keys: string[] = Object.keys(node.keyArgs);
    for (const info of argsInfo) {
        const aliasIndex =
            (info.aliases
                .map(alias => [alias, keys.indexOf(alias)] as const)
                .find(([_, indexOf]) => indexOf !== -1) ?? [])[1] ?? -1;

        const nameIndex = keys.indexOf(info.name);

        const index = nameIndex !== -1 ? nameIndex : aliasIndex;
        if (index === -1) {
            continue;
        }

        const key = keys.splice(index, 1)[0];
        const keyArgNodes = node.keyArgs[key];
        if (result[info.name]) {
            diagnostic.push(
                nodesToDiagnose(
                    keyArgNodes.length === 0 ? [node] : keyArgNodes,
                    DiagnoseSeverity.Warning,
                    DiagnoseErrorType.ApplyParserError,
                    `Argument ${key} specified twice`,
                ),
            );
        }

        const convertResult = convertArgumentType(info, keyArgNodes, info.type);
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
                `Expected argument '${info.name}'`,
            ),
        );
    }

    return {
        result,
        diagnostic,
    };
}
