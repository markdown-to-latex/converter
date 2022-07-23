import { TokenParser, TokenPredicate } from '../struct';
import { isPrevTokenDelimiter } from './breaks';
import { TokenType } from '../../tokenizer';
import {
    HrNode,
    NodeType,
    NonBreakingSpaceNode,
    ThinNonBreakingSpaceNode,
} from '../../../node';

export const isNonBreakingSpace: TokenPredicate = function (
    token,
    index,
    node,
) {
    return token.type === TokenType.JoinableSpecial && token.text === '~~';
};

export const isThinNonBreakingSpace: TokenPredicate = function (
    token,
    index,
    node,
) {
    return token.type === TokenType.JoinableSpecial && token.text === '~';
};

export const parseNonBreakingSpace: TokenParser = function (tokens, index) {
    const token = tokens.tokens[index];
    if (!isNonBreakingSpace(token, index, tokens)) {
        return null;
    }

    const space: NonBreakingSpaceNode = {
        type: NodeType.NonBreakingSpace,
        parent: tokens.parent,
        pos: {
            start: token.pos,
            end: token.pos + token.text.length,
        },
    };

    return {
        nodes: [space],
        index: index + 1,
        diagnostic: [],
    };
};

export const parseThinNonBreakingSpace: TokenParser = function (tokens, index) {
    const token = tokens.tokens[index];
    if (!isThinNonBreakingSpace(token, index, tokens)) {
        return null;
    }

    const space: ThinNonBreakingSpaceNode = {
        type: NodeType.ThinNonBreakingSpace,
        parent: tokens.parent,
        pos: {
            start: token.pos,
            end: token.pos + token.text.length,
        },
    };

    return {
        nodes: [space],
        index: index + 1,
        diagnostic: [],
    };
};
