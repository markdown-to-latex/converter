import { TokenParser, TokenPredicate } from '../struct';
import { isPrevTokenDelimiter } from './breaks';
import { TokenType } from '../../tokenizer';
import { HrNode, NodeType } from '../../../node';

export const isHr: TokenPredicate = function (token, index, node) {
    if (!isPrevTokenDelimiter(token, index, node)) {
        return false;
    }

    if (
        !(
            token.type === TokenType.JoinableSpecial &&
            token.text.startsWith('---')
        )
    ) {
        return false;
    }

    return node.tokens[index + 1]?.type === TokenType.Delimiter;
};

export const parseHr: TokenParser = function (tokens, index) {
    const token = tokens.tokens[index];
    if (!isHr(token, index, tokens)) {
        return null;
    }

    const hr: HrNode = {
        type: NodeType.Hr,
        parent: tokens.parent,
        pos: {
            start: token.pos,
            end: token.pos + token.text.length,
        },
    };

    return {
        nodes: [hr],
        index: index + 1,
        diagnostic: [],
    };
};
