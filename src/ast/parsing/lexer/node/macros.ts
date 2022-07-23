import { TokenParser, TokenPredicate } from '../struct';
import { Token, TokenType } from '../../tokenizer';
import {
    Node,
    NodeType,
    OpCodeNode,
    RawNodeType,
    TokensNode,
} from '../../../node';
import {
    applyVisitors,
    findTokenClosingBracket,
    sliceTokenText,
    tokenToDiagnose,
} from '../index';
import { DiagnoseList, DiagnoseSeverity } from '../../../../diagnose';

export const isMacro: TokenPredicate = function (token, index, node) {
    if (!(token.type === TokenType.SeparatedSpecial && token.text === '!')) {
        return false;
    }

    const nameToken: Token | null = node.tokens[index + 1] ?? null;
    if (nameToken?.type !== TokenType.Letter) {
        return false;
    }

    const bracketToken: Token | null = node.tokens[index + 2] ?? null;
    return (
        bracketToken?.type === TokenType.SeparatedSpecial &&
        (bracketToken?.text === '(' || bracketToken?.text === '[')
    );
};

export interface GetMacroLabelResult {
    index: number;
    label: string | null;
    diagnostic: DiagnoseList;
}

export function getMacroLabel(
    tokens: TokensNode,
    index: number,
): GetMacroLabelResult {
    const token = tokens.tokens[index];

    if (token.text !== '[') {
        return {
            label: null,
            index: index,
            diagnostic: [],
        };
    }

    const endTokenResult = findTokenClosingBracket(
        tokens,
        index,
        true /*because it's label*/,
    );
    if (!endTokenResult) {
        return {
            index: index,
            label: null,
            diagnostic: [
                tokenToDiagnose(
                    tokens,
                    index,
                    'Unable to found closing label bracket',
                    DiagnoseSeverity.Error,
                ),
            ],
        };
    }

    return {
        label: tokens.tokens
            .slice(index + 1, endTokenResult.index)
            .map(v => v.text)
            .join(''),
        index: endTokenResult.index + 1,
        diagnostic: [],
    };
}

export interface GetMacroArgsResult {
    index: number;
    posArgs: TokensNode[];
    keyArgs: Record<string, TokensNode>;
    diagnostic: DiagnoseList;
}

export function getMacroArgs(
    tokens: TokensNode,
    index: number,
): GetMacroArgsResult {
    const posArgs: TokensNode[] = [];
    const keyArgs: Record<string, TokensNode> = {};

    let argsIndex = index;
    let argsToken: Token | null = tokens.tokens[argsIndex] ?? null;

    const diagnostic: DiagnoseList = [];

    while (
        argsToken?.type === TokenType.SeparatedSpecial &&
        argsToken.text === '('
    ) {
        const endTokenResult = findTokenClosingBracket(tokens, argsIndex);
        if (!endTokenResult) {
            return {
                posArgs,
                keyArgs,
                index: argsIndex,
                diagnostic: [
                    tokenToDiagnose(
                        tokens,
                        index,
                        'Unable to found closing arg bracket',
                        DiagnoseSeverity.Error,
                    ),
                ],
            };
        }

        let keyToken: Token | null = null;
        const keyChar = tokens.tokens[argsIndex + 1];
        const keyTokenIndex = argsIndex + 2;
        const spacerTokenIndex = argsIndex + 3;
        if (
            keyChar.type === TokenType.SeparatedSpecial &&
            keyChar.text === '@' &&
            tokens.tokens[keyTokenIndex]?.type === TokenType.Letter &&
            (tokens.tokens[spacerTokenIndex]?.type === TokenType.Spacer ||
                (tokens.tokens[spacerTokenIndex]?.type ===
                    TokenType.Delimiter &&
                    tokens.tokens[spacerTokenIndex].text.length <= 1))
        ) {
            keyToken = tokens.tokens[keyTokenIndex];
        }

        const endToken = tokens.tokens[endTokenResult.index];
        if (keyToken) {
            if (keyToken.text in keyArgs) {
                diagnostic.push(
                    tokenToDiagnose(
                        tokens,
                        keyTokenIndex,
                        `Key ${keyToken.text} already specified`,
                        DiagnoseSeverity.Error,
                    ),
                );
            }

            keyArgs[keyToken.text] = {
                type: RawNodeType.Tokens,
                parent: tokens,
                text: sliceTokenText(
                    tokens,
                    argsIndex + 4,
                    endTokenResult.index,
                ),
                tokens: tokens.tokens.slice(
                    argsIndex + 4,
                    endTokenResult.index,
                ),
                pos: {
                    start: tokens.tokens[argsIndex + 4].pos,
                    end: endToken.pos + endToken.text.length,
                },
            };
        } else {
            if (Object.keys(keyArgs).length !== 0) {
                diagnostic.push(
                    tokenToDiagnose(
                        tokens,
                        argsIndex + 1,
                        'Positional argument has been specified after key argument',
                        DiagnoseSeverity.Error,
                    ),
                );
            }

            posArgs.push({
                type: RawNodeType.Tokens,
                parent: tokens,
                tokens: tokens.tokens.slice(
                    argsIndex + 1,
                    endTokenResult.index,
                ),
                text: sliceTokenText(
                    tokens,
                    argsIndex + 1,
                    endTokenResult.index,
                ),
                pos: {
                    start: tokens.tokens[argsIndex + 1].pos,
                    end: endToken.pos + endToken.text.length,
                },
            });
        }

        argsIndex = endTokenResult.index + 1;
        argsToken = tokens.tokens[argsIndex] ?? null;
    }

    return {
        posArgs,
        keyArgs,
        index: argsIndex,
        diagnostic: diagnostic,
    };
}

export interface ParseArgsResult<T> {
    result: T;
    diagnostic: DiagnoseList;
}

export function parseMacroPosArgs(
    posArgs: TokensNode[],
): ParseArgsResult<Node[][]> {
    const diagnostic: DiagnoseList = [];
    const result = posArgs.map(n => {
        const result = applyVisitors([n]);
        diagnostic.push(...result.diagnostic);
        return result.nodes;
    });

    return {
        result,
        diagnostic,
    };
}

export function parseMacroKeyArgs(
    keyArgs: Record<string, TokensNode>,
): ParseArgsResult<Record<string, Node[]>> {
    const diagnostic: DiagnoseList = [];
    const result = Object.fromEntries(
        Object.entries(keyArgs).map(([k, v]) => {
            const result = applyVisitors([v]);
            diagnostic.push(...result.diagnostic);

            return [k, result.nodes];
        }),
    );

    return {
        result,
        diagnostic,
    };
}

export const parseMacro: TokenParser = function (tokens, index) {
    const token = tokens.tokens[index];
    if (!isMacro(token, index, tokens)) {
        return null;
    }

    const name = tokens.tokens[index + 1]!.text;

    const diagnostic: DiagnoseList = [];
    const labelResult = getMacroLabel(tokens, index + 2);

    const label = labelResult.label;
    diagnostic.push(...labelResult.diagnostic);

    const macroArgsResult = getMacroArgs(tokens, labelResult.index);
    diagnostic.push(...macroArgsResult.diagnostic);

    const parsePosArgsResult = parseMacroPosArgs(macroArgsResult.posArgs);
    diagnostic.push(...parsePosArgsResult.diagnostic);

    const parseKeyArgsResult = parseMacroKeyArgs(macroArgsResult.keyArgs);
    diagnostic.push(...parseKeyArgsResult.diagnostic);

    const endToken = tokens.tokens[macroArgsResult.index - 1];
    const macrosNode: OpCodeNode = {
        type: NodeType.OpCode,
        pos: {
            start: token.pos,
            end: endToken.pos + endToken.text.length,
        },
        posArgs: parsePosArgsResult.result,
        keyArgs: parseKeyArgsResult.result,
        parent: tokens.parent,
        label,
        opcode: name,
    };

    parsePosArgsResult.result.forEach(v =>
        v.forEach(v => (v.parent = macrosNode)),
    );
    Object.values(parseKeyArgsResult.result).forEach(v =>
        v.forEach(v => (v.parent = macrosNode)),
    );

    return {
        nodes: [macrosNode],
        index: macroArgsResult.index,
        diagnostic: diagnostic,
    };
};
