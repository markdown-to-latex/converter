import { TokenParser, TokenPredicate } from '../struct';
import { TokenType } from '../../tokenizer';
import { CodeNode, CodeSpanNode, LatexSpanNode, NodeType } from '../../../node';
import {
    findTokenClosingBracket,
    findTokenOrNull,
    findTokenOrNullBackward,
    unexpectedEof,
} from '../index';
import { isParagraphBreak } from './breaks';

export const isLatexSpan: TokenPredicate = function (token, index, node) {
    if (token.type !== TokenType.JoinableSpecial) {
        return false;
    }

    return token.text === '$$';
};

export const parseLatexSpan: TokenParser = function (tokens, index) {
    const token = tokens.tokens[index];
    if (!isLatexSpan(token, index, tokens)) {
        return null;
    }

    const endTokenResult = findTokenClosingBracket(tokens, index, true);
    if (!endTokenResult) {
        return unexpectedEof(
            tokens,
            index,
            'Unable to find closing quotes for span latex',
        );
    }

    const endToken = endTokenResult.token;
    return {
        nodes: [
            {
                type: NodeType.LatexSpan,
                pos: {
                    start: token.pos,
                    end: endToken.pos + endToken.text.length,
                },
                text: tokens.tokens
                    .slice(index + 1, endTokenResult.index)
                    .map(v => v.text)
                    .join(''),
                parent: tokens.parent,
            } as LatexSpanNode,
        ],
        index: endTokenResult.index + 1,
        diagnostic: [],
    };
};
