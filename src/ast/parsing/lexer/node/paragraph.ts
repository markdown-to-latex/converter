import {TokenParser, TokenPredicate} from "../struct";
import {TokenType} from "../../tokenizer";

export const isParagraphBreak: TokenPredicate = function (token, index, node) {
    if (token.type !== TokenType.Delimiter) {
        return false;
    }

    return node.tokens[index + 1]?.type === TokenType.Delimiter;
};

export const isSoftBreak: TokenPredicate = function (token, index, node) {
    if (token.type !== TokenType.Delimiter) {
        return false;
    }

    return node.tokens[index + 1]?.type !== TokenType.Delimiter;
}

/**
 * Does not create a new line break
 */
export const parseSoftBreak: TokenParser = function (tokens, index) {
    const token =  tokens.tokens[index];

    if (!isSoftBreak(token, index, tokens)) {
        return null;
    }

    return {
        nodes: [],
        index: index + 1,
        diagnostic: [],
    }
}