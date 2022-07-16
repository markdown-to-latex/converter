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
        if (
            keyChar.type === TokenType.SeparatedSpecial &&
            keyChar.text === '@' &&
            tokens.tokens[keyTokenIndex]?.type === TokenType.Letter &&
            tokens.tokens[argsIndex + 3]?.type === TokenType.Spacer
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
                parent: null,
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
                parent: null,
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

    const endToken = tokens.tokens[macroArgsResult.index - 1];
    const macrosNode: OpCodeNode = {
        type: NodeType.OpCode,
        pos: {
            start: token.pos,
            end: endToken.pos + endToken.text.length,
        },
        posArgs: parsePosArgs,
        keyArgs: parseKeyArgs,
        parent: tokens.parent,
        label,
        opcode: name,
    };

    parsePosArgs.forEach(v => v.forEach(v => (v.parent = macrosNode)));
    Object.values(parseKeyArgs).forEach(v =>
        v.forEach(v => (v.parent = macrosNode)),
    );

    return {
        nodes: [macrosNode],
        index: macroArgsResult.index,
        diagnostic: diagnostic,
    };
};
