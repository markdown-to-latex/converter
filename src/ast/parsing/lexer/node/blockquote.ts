import {TokenParser, TokenPredicate,} from '../struct';
import {Token, TokenType} from '../../tokenizer';
import {applyVisitors, findTokenOrNull, sliceTokenText,} from '../index';
import {BlockquoteNode, HeadingNode, NodeType, RawNodeType, TokensNode} from "../../../node";
import {DiagnoseList} from "../../../../diagnose";
import {isPrevTokenDelimiter} from "./breaks";

export const isBlockquote: TokenPredicate = function (token, index, node) {
    if (!isPrevTokenDelimiter(node.tokens[index], index, node)) {
        return false;
    }

    if (token.type !== TokenType.SeparatedSpecial) {
        return false;
    }
    if (token.text !== '>') {
        return false;
    }

    return node.tokens[index + 1]?.type === TokenType.Spacer && node.tokens[index + 2] !== undefined;
};

export const parseBlockquote: TokenParser = function (tokens, index) {
    const token = tokens.tokens[index];
    if (!isBlockquote(token, index, tokens)) {
        return null;
    }

    const startIndex = index + 2;
    const startToken: Token | null = tokens.tokens[startIndex];

    const delimiter = findTokenOrNull(tokens, startIndex, n => n.type === TokenType.Delimiter);
    const lineDelimiterIndex = delimiter?.index ?? tokens.tokens.length;

    const endToken = tokens.tokens[lineDelimiterIndex];
    const blockquoteNode: BlockquoteNode = {
        type: NodeType.Blockquote,
        parent: tokens.parent,
        pos: {
            start: token.pos,
            end: endToken.pos + endToken.text.length
        },
        children: []
    }

    const tokensNode: TokensNode = {
        type: RawNodeType.Tokens,
        parent: blockquoteNode,
        tokens: tokens.tokens.slice(startIndex, lineDelimiterIndex),
        text: sliceTokenText(tokens, startIndex, lineDelimiterIndex),
        pos: {
            start: startToken.pos,
            end: endToken.pos + endToken.text.length,
        },
    }

    const diagnostic: DiagnoseList = [];

    const visitorsResult = applyVisitors([tokensNode]);
    diagnostic.push(...visitorsResult.diagnostic)

    blockquoteNode.children = visitorsResult.nodes;

    return {
        nodes: [blockquoteNode],
        index: lineDelimiterIndex + 1,
        diagnostic
    }
};
