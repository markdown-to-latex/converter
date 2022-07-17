import {TokenParser, TokenPredicate} from "../struct";
import {TokenType} from "../../tokenizer";
import {findTokenOrNull} from "../index";
import {CommentNode, NodeType} from "../../../node";

export const isComment: TokenPredicate = function (token, index, node) {
    return token.type === TokenType.JoinableSpecial && token.text === '//';
}

export const parseComment: TokenParser = function (tokens, index) {
    const token = tokens.tokens[index];
    if (!isComment(token, index, tokens)) {
        return null;
    }

    const delimiter = findTokenOrNull(tokens, index, n => n.type === TokenType.Delimiter);
    const lineDelimiterIndex = delimiter?.index ?? tokens.tokens.length;

    const endToken = tokens.tokens[lineDelimiterIndex];
    const commentNode: CommentNode = {
        type: NodeType.Comment,
        parent: tokens.parent,
        pos: {
            start: token.pos,
            end: endToken.pos + endToken.text.length,
        },
    }

    return {
        nodes: [commentNode],
        index: lineDelimiterIndex + 1,
        diagnostic: [],
    }
}