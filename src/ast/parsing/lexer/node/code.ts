import {
    TokenByTypeParserResult,
    TokenParser,
    TokenPredicate,
} from '../struct';
import { TokenType } from '../../tokenizer';
import { CodeNode, NodeType, TokensNode } from '../../../node';
import {
    findTokenOrNull,
    findTokenOrNullBackward,
    tokenToDiagnose,
    unexpectedEof,
} from '../index';
import { DiagnoseSeverity } from '../../../../diagnose';
import {isPrevTokenDelimiter} from "./paragraph";

export const isCode: TokenPredicate = function (token, index, node) {
    if (!isPrevTokenDelimiter(token, index, node)) {
        return false;
    }

    if (token.type !== TokenType.JoinableSpecial) {
        return false;
    }
    if (!token.text.startsWith('```')) {
        return false;
    }

    if (index && node.tokens[index - 1].type !== TokenType.Delimiter) {
        return !(
            node.tokens[index - 1].type !== TokenType.Spacer ||
            node.tokens[index - 2]?.type !== TokenType.Delimiter
        );
    }

    return true;
};

export const parseCode: TokenParser = function (tokens, index) {
    const token = tokens.tokens[index];
    if (!isCode(token, index, tokens)) {
        return null;
    }

    const lineBreakResult = findTokenOrNull(
        tokens,
        index + 1,
        t => t.type === TokenType.Delimiter,
    );
    if (!lineBreakResult) {
        return unexpectedEof(
            tokens,
            index,
            'Unable to find line break after code',
        );
    }

    let languageName: string | null = null;
    for (let i = index + 1; i < lineBreakResult.index; ++i) {
        const token = tokens.tokens[i];
        if (
            [
                TokenType.Letter,
                TokenType.SeparatedSpecial,
                TokenType.JoinableSpecial,
            ].indexOf(token.type) === -1
        ) {
            break;
        }

        languageName ??= '';
        languageName += token.text;
    }

    const endTokenResult = findTokenOrNull(
        tokens,
        lineBreakResult.index + 1,
        isCode,
    );
    if (!endTokenResult) {
        return unexpectedEof(
            tokens,
            index,
            'Unable to find closing quotes for block code',
        );
    }

    const lineBreakEndResult = findTokenOrNullBackward(
        tokens,
        endTokenResult.index - 1,
        t => t.type === TokenType.Delimiter,
    );
    if (!lineBreakEndResult) {
        return unexpectedEof(
            tokens,
            index,
            'Unable to find end closing quotes for block code ' +
                '(internal error)',
        );
    }

    const endToken = endTokenResult.token;
    const endBreak = lineBreakEndResult.token;
    const startBreak = lineBreakResult.token;
    return {
        nodes: [
            {
                type: NodeType.Code,
                pos: {
                    start: token.pos,
                    end: endToken.pos + endToken.text.length,
                },
                text: tokens.tokens
                    .slice(lineBreakResult.index + 1, lineBreakEndResult.index)
                    .map(v => v.text)
                    .join(''),
                parent: tokens.parent,
                lang: languageName,
                codeBlockStyle: null,
            } as CodeNode,
        ],
        index: endTokenResult.index + 1,
        diagnostic: [],
    };
};
