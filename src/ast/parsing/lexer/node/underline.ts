import { TokenParser, TokenPredicate } from '../struct';
import { TokenType } from '../../tokenizer';
import {
    applyVisitors,
    findTokenClosingBracket,
    sliceTokenText,
} from '../index';
import {
    EmNode,
    NodeType,
    RawNodeType,
    TokensNode,
    UnderlineNode,
} from '../../../node';
import { DiagnoseList } from '../../../../diagnose';

export const isUnderline: TokenPredicate = function (token, index, node) {
    return token.type === TokenType.JoinableSpecial && token.text === '_';
};

export const parseUnderline: TokenParser = function (tokens, index) {
    const token = tokens.tokens[index];

    if (!isUnderline(token, index, tokens)) {
        return null;
    }

    const bracketResult = findTokenClosingBracket(tokens, index);
    if (!bracketResult) {
        return null;
    }

    const underlineNode: UnderlineNode = {
        type: NodeType.Underline,
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
        parent: underlineNode,
        pos: {
            start: token.pos,
            end: bracketResult.token.pos + bracketResult.token.text.length,
        },
    };

    const diagnostic: DiagnoseList = [];

    const visitorsResult = applyVisitors([tokensNode]);
    underlineNode.children = [...visitorsResult.nodes];
    diagnostic.push(...visitorsResult.diagnostic);

    return {
        nodes: [underlineNode],
        index: bracketResult.index + 1,
        diagnostic,
    };
};
