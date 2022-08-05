import { TokenParser } from '../struct';
import {
    applyVisitors,
    findTokenClosingBracket,
    isOpenArgumentBracket,
    isOpenLabelBracket,
    sliceTokenText,
    unexpectedEof,
} from '../index';
import {
    LinkNode,
    NodeType,
    RawNodeType,
    TextNode,
    TokensNode,
} from '../../../node';

export const parseLink: TokenParser = function (tokens, index) {
    const token = tokens.tokens[index];
    if (!isOpenLabelBracket(tokens, index)) {
        return null;
    }

    const closingBracketResult = findTokenClosingBracket(tokens, index);
    if (!closingBracketResult) {
        return unexpectedEof(
            tokens,
            index,
            'Unable to find closing bracket for link',
        );
    }

    const argOpenBracketIndex = closingBracketResult.index + 1;
    if (tokens.tokens.length <= argOpenBracketIndex) {
        return unexpectedEof(tokens, index, 'No arg bracket');
    }

    const argOpenBracket = tokens.tokens[argOpenBracketIndex];
    if (!isOpenArgumentBracket(tokens, argOpenBracketIndex)) {
        return null; // No bracket => thats not a link
    }

    const argCloseBracketResult = findTokenClosingBracket(
        tokens,
        argOpenBracketIndex,
    );
    if (!argCloseBracketResult) {
        return unexpectedEof(
            tokens,
            argOpenBracketIndex,
            'Unable to find closing bracket for link arg',
        );
    }

    const endToken = argCloseBracketResult.token;

    const childTokens = tokens.tokens.slice(
        index + 1,
        closingBracketResult.index,
    );
    const childNodePosStart = tokens.tokens[index + 1].pos;
    const childNodePosEnd =
        tokens.tokens[closingBracketResult.index - 1].pos +
        tokens.tokens[closingBracketResult.index - 1].text.length;
    const childNode: TokensNode = {
        type: RawNodeType.Tokens,
        tokens: childTokens,
        parent: null,
        pos: {
            start: childNodePosStart,
            end: childNodePosEnd,
        },
        text: sliceTokenText(tokens, index + 1, closingBracketResult.index),
    };

    const hrefStartToken = tokens.tokens[argOpenBracketIndex + 1];
    const hrefStopToken = tokens.tokens[argCloseBracketResult.index - 1];
    const hrefText = tokens.tokens
        .slice(argOpenBracketIndex + 1, argCloseBracketResult.index)
        .map(v => v.text)
        .join('');

    const hrefTextNode: TextNode = {
        type: NodeType.Text,
        text: hrefText,
        parent: null,
        pos: {
            start: hrefStartToken.pos,
            end: hrefStopToken.pos + hrefStopToken.text.length,
        },
    };

    const linkNode: LinkNode = {
        type: NodeType.Link,
        parent: tokens.parent,
        pos: {
            start: token.pos,
            end: endToken.pos + endToken.text.length,
        },
        children: [childNode],
        href: hrefTextNode,
    };
    childNode.parent = linkNode;
    hrefTextNode.parent = linkNode;

    const result = applyVisitors([childNode]);
    linkNode.children = [...result.nodes];

    return {
        nodes: [linkNode],
        index: argCloseBracketResult.index + 1,
        diagnostic: [...result.diagnostic],
    };
};
