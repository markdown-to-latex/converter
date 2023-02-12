import { TokenParser, TokenPredicate } from '../struct';
import { LINE_SPLIT_REGEXP, Token, TokenType } from '../../tokenizer';
import {
    BrNode,
    NodeType,
    ParagraphBreakNode,
    RawNodeType,
    SoftBreakNode,
} from '../../../node';

export function getDelimiterBreaks(token: Token): number {
    return token.type !== TokenType.Delimiter
        ? 0
        : Array.from(token.text.matchAll(LINE_SPLIT_REGEXP)).length;
}

export const isPrevTokenDelimiter: TokenPredicate = function (
    token,
    index,
    node,
) {
    return index === 0 || node.tokens[index - 1].type === TokenType.Delimiter;
};

export const isParagraphBreak: TokenPredicate = function (token, index, node) {
    if (token.type !== TokenType.Delimiter) {
        return false;
    }

    return getDelimiterBreaks(token) >= 2;
};

export const isSoftBreak: TokenPredicate = function (token, index, node) {
    if (token.type !== TokenType.Delimiter) {
        return false;
    }

    return getDelimiterBreaks(token) == 1;
};

export const isTextBreak: TokenPredicate = function (token, index, node) {
    if (token.type !== TokenType.Spacer || token.text.length < 2) {
        return false;
    }

    return (
        node.tokens[index + 1]?.type === TokenType.Delimiter &&
        getDelimiterBreaks(node.tokens[index + 1]) === 1
    );
};

/**
 * Does not create a new line break
 */
export const parseSoftBreak: TokenParser = function (tokens, index) {
    const token = tokens.tokens[index];

    if (!isSoftBreak(token, index, tokens)) {
        return null;
    }

    const textNode: SoftBreakNode = {
        type: RawNodeType.SoftBreak,
        parent: tokens.parent,
        pos: {
            start: token.pos,
            end: token.pos + token.text.length,
        },
    };

    return {
        nodes: [textNode],
        index: index + 1,
        diagnostic: [],
    };
};

/**
 * Does not create a new line break
 */
export const parseParagraphBreak: TokenParser = function (tokens, index) {
    const token = tokens.tokens[index];

    if (!isParagraphBreak(token, index, tokens)) {
        return null;
    }

    const textNode: ParagraphBreakNode = {
        type: RawNodeType.ParagraphBreak,
        parent: tokens.parent,
        pos: {
            start: token.pos,
            end: token.pos + token.text.length,
        },
    };

    return {
        nodes: [textNode],
        index: index + 1,
        diagnostic: [],
    };
};

/**
 * Create a text break (br)
 */
export const parseTextBreak: TokenParser = function (tokens, index) {
    const token = tokens.tokens[index];

    if (!isTextBreak(token, index, tokens)) {
        return null;
    }

    const textNode: BrNode = {
        type: NodeType.Br,
        parent: tokens.parent,
        pos: {
            start: token.pos,
            end: token.pos + token.text.length,
        },
    };

    return {
        nodes: [textNode],
        index: index + 1,
        diagnostic: [],
    };
};