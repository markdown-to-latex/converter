import { TokenParser, TokenPredicate } from '../struct';
import { TokenType } from '../../tokenizer';
import {
    applyVisitors,
    findTokenClosingBracket,
    sliceTokenText,
} from '../index';
import {
    DelNode,
    EmNode,
    NodeType,
    RawNodeType,
    TokensNode,
} from '../../../node';
import { DiagnoseList } from '../../../../diagnostic';

export const isDel: TokenPredicate = function (token, index, node) {
    return token.type === TokenType.JoinableSpecial && token.text === '==';
};

export const parseDel: TokenParser = function (tokens, index) {
    const token = tokens.tokens[index];

    if (!isDel(token, index, tokens)) {
        return null;
    }

    const bracketResult = findTokenClosingBracket(tokens, index);
    if (!bracketResult) {
        return null;
    }

    const delNode: DelNode = {
        type: NodeType.Del,
        parent: tokens.parent,
        children: [],
        pos: {
            start: token.pos,
            end: bracketResult.token.pos + bracketResult.token.text.length,
        },
    };

    const tokensNode: TokensNode = {
        type: RawNodeType.Tokens,
        tokens: tokens.tokens.slice(index + 1, bracketResult.index),
        text: sliceTokenText(tokens, index + 1, bracketResult.index),
        parent: delNode,
        pos: {
            start: token.pos,
            end: bracketResult.token.pos + bracketResult.token.text.length,
        },
    };

    const diagnostic: DiagnoseList = [];

    const visitorsResult = applyVisitors([tokensNode]);
    delNode.children = [...visitorsResult.nodes];
    diagnostic.push(...visitorsResult.diagnostic);

    return {
        nodes: [delNode],
        index: bracketResult.index + 1,
        diagnostic,
    };
};
