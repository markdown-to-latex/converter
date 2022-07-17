import { TokenParser, TokenPredicate } from '../struct';
import { Token, TokenType } from '../../tokenizer';
import { applyVisitors, findTokenOrNull, sliceTokenText } from '../index';
import { HeadingNode, NodeType, RawNodeType, TokensNode } from '../../../node';
import { DiagnoseList } from '../../../../diagnose';
import { isPrevTokenDelimiter } from './breaks';

export const isHeading: TokenPredicate = function (token, index, node) {
    if (!isPrevTokenDelimiter(node.tokens[index], index, node)) {
        return false;
    }

    if (token.type !== TokenType.JoinableSpecial) {
        return false;
    }
    if (!token.text.startsWith('#')) {
        // TODO: must contain only #
        return false;
    }

    return (
        node.tokens[index + 1]?.type === TokenType.Spacer &&
        node.tokens[index + 2] !== undefined
    );
};

export const parseHeading: TokenParser = function (tokens, index) {
    const token = tokens.tokens[index];
    if (!isHeading(token, index, tokens)) {
        return null;
    }

    const startIndex = index + 2;
    const startToken: Token | null = tokens.tokens[startIndex];

    const delimiter = findTokenOrNull(
        tokens,
        startIndex,
        n => n.type === TokenType.Delimiter,
    );
    const lineDelimiterIndex = delimiter?.index ?? tokens.tokens.length;

    const endToken = tokens.tokens[lineDelimiterIndex - 1];
    const headingNode: HeadingNode = {
        type: NodeType.Heading,
        parent: tokens.parent,
        pos: {
            start: token.pos,
            end: endToken.pos + endToken.text.length,
        },
        depth: token.text.length,
        children: [],
    };

    const tokensNode: TokensNode = {
        type: RawNodeType.Tokens,
        parent: headingNode,
        tokens: tokens.tokens.slice(startIndex, lineDelimiterIndex),
        text: sliceTokenText(tokens, startIndex, lineDelimiterIndex),
        pos: {
            start: startToken.pos,
            end: endToken.pos + endToken.text.length,
        },
    };

    const diagnostic: DiagnoseList = [];

    const visitorsResult = applyVisitors([tokensNode]);
    diagnostic.push(...visitorsResult.diagnostic);

    headingNode.children = visitorsResult.nodes;

    return {
        nodes: [headingNode],
        index: lineDelimiterIndex + 1,
        diagnostic: diagnostic,
    };
};
