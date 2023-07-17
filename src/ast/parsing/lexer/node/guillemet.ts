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
import { TokenType } from '../../tokenizer';

/**
 * Angle bracket
 */
export function isOpenGuillemet(tokens: TokensNode, index: number): boolean {
    const token = tokens.tokens[index];
    return token.type === TokenType.JoinableSpecial && token.text == '<<<';
}

export const parseGuillemet: TokenParser = function (tokens, index) {
    const token = tokens.tokens[index];
    if (!isOpenGuillemet(tokens, index)) {
        return null;
    }

    const closingBracketResult = findTokenClosingBracket(tokens, index);
    if (!closingBracketResult) {
        return unexpectedEof(
            tokens,
            index,
            'Unable to find closing bracket for guillemet',
        );
    }

    const hrefStartToken = tokens.tokens[index + 1];
    const hrefStopToken = tokens.tokens[closingBracketResult.index - 1];
    const hrefText = tokens.tokens
        .slice(index + 1, closingBracketResult.index)
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

    const endToken = closingBracketResult.token;
    const linkNode: LinkNode = {
        type: NodeType.Link,
        parent: tokens.parent,
        pos: {
            start: token.pos,
            end: endToken.pos + endToken.text.length,
        },
        children: [],
        href: hrefTextNode,
    };
    hrefTextNode.parent = linkNode;

    return {
        nodes: [linkNode],
        index: closingBracketResult.index + 1,
        diagnostic: [],
    };
};
