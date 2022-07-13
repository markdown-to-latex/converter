import {TokenParser, TokenPredicate} from "../struct";
import {TokenType} from "../../tokenizer";
import {NodeType, TextNode} from "../../../node";

export const isPrevTokenDelimiter: TokenPredicate = function (token, index, node) {
    return index === 0 || node.tokens[index - 1].type === TokenType.Delimiter;
}

export const isParagraphBreak: TokenPredicate = function (token, index, node) {
    if (token.type !== TokenType.Delimiter) {
        return false;
    }

    return token.text.length >= 2;
};

export const isSoftBreak: TokenPredicate = function (token, index, node) {
    if (token.type !== TokenType.Delimiter) {
        return false;
    }

    return token.text.length == 1;
}

/**
 * Does not create a new line break
 */
export const parseSoftBreak: TokenParser = function (tokens, index) {
    const token = tokens.tokens[index];

    if (!isSoftBreak(token, index, tokens)) {
        return null;
    }

    const textNode: TextNode = {
        type: NodeType.Text,
        parent: tokens.parent,
        text: ' ',
        pos: {
            start: token.pos,
            end: token.pos + token.text.length,
        },
        children: []
    }

    return {
        nodes: [textNode],
        index: index + 1,
        diagnostic: [],
    }
}
