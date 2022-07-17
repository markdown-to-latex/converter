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
    StrongNode,
    TokensNode,
} from '../../../node';
import { DiagnoseList } from '../../../../diagnose';

export const isStrong: TokenPredicate = function (token, index, node) {
    return (
        token.type === TokenType.JoinableSpecial && token.text.startsWith('**')
    );
};

export const parseStrongWithOptionalEm: TokenParser = function (tokens, index) {
    const token = tokens.tokens[index];

    if (!isStrong(token, index, tokens)) {
        return null;
    }

    const bracketResult = findTokenClosingBracket(tokens, index);
    if (!bracketResult) {
        return null;
    }

    const strongNode: StrongNode = {
        type: NodeType.Strong,
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
        parent: strongNode,
        pos: {
            start: token.pos,
            end: bracketResult.token.pos + bracketResult.token.text.length,
        },
    };

    const diagnostic: DiagnoseList = [];

    const visitorsResult = applyVisitors([tokensNode]);
    diagnostic.push(...visitorsResult.diagnostic);

    if (token.text.length >= 3) {
        // pattern '***'

        const emNode: EmNode = {
            type: NodeType.Em,
            parent: tokens.parent,
            children: [...visitorsResult.nodes],
            pos: {
                start: token.pos,
                end: bracketResult.token.pos + bracketResult.token.text.length,
            },
        };
        strongNode.children = [emNode];
        visitorsResult.nodes.forEach(n => (n.parent = emNode));
    } else {
        // pattern '**'
        strongNode.children = [...visitorsResult.nodes];
        visitorsResult.nodes.forEach(n => (n.parent = strongNode));
    }

    return {
        nodes: [strongNode],
        index: bracketResult.index + 1,
        diagnostic,
    };
};
