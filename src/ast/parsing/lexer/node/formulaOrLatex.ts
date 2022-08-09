import { TokenParser, TokenPredicate } from '../struct';
import { TokenType } from '../../tokenizer';
import { FormulaNode, LatexNode, NodeType } from '../../../node';
import {
    findTokenOrNull,
    findTokenOrNullBackward,
    unexpectedEof,
} from '../index';
import {
    DiagnoseErrorType,
    DiagnoseList,
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../../../../diagnostic';
import { isPrevTokenDelimiter } from './breaks';

export const isLatex: TokenPredicate = function (token, index, node) {
    if (!isPrevTokenDelimiter(token, index, node)) {
        return false;
    }

    if (token.type !== TokenType.JoinableSpecial) {
        return false;
    }
    if (!token.text.startsWith('$$$')) {
        return false;
    }

    if (index && node.tokens[index - 1].type !== TokenType.Delimiter) {
        return !(
            node.tokens[index - 1].type !== TokenType.Spacer ||
            node.tokens[index - 2]?.type !== TokenType.Delimiter
        );
    }

    return true;
};

const enum LatexTarget {
    Raw = 'raw',
    Math = 'math',
}

export const parseFormulaOrLatex: TokenParser = function (tokens, index) {
    const token = tokens.tokens[index];
    if (!isLatex(token, index, tokens)) {
        return null;
    }

    const diagnostic: DiagnoseList = [];

    const lineBreakResult = findTokenOrNull(
        tokens,
        index + 1,
        t => t.type === TokenType.Delimiter,
    );
    if (!lineBreakResult) {
        return unexpectedEof(
            tokens,
            index,
            'Unable to find line break after code',
        );
    }

    let latexTarget: string = '';
    for (let i = index + 1; i < lineBreakResult.index; ++i) {
        // TODO: encapsulate
        const token = tokens.tokens[i];
        if (
            [
                TokenType.Letter,
                TokenType.SeparatedSpecial,
                TokenType.JoinableSpecial,
            ].indexOf(token.type) === -1
        ) {
            break;
        }

        latexTarget ??= '';
        latexTarget += token.text;
    }

    const endTokenResult = findTokenOrNull(
        tokens,
        lineBreakResult.index + 1,
        isLatex,
    );
    if (!endTokenResult) {
        return unexpectedEof(
            tokens,
            index,
            'Unable to find closing quotes for block code',
        );
    }

    const lineBreakEndResult = findTokenOrNullBackward(
        tokens,
        endTokenResult.index - 1,
        t => t.type === TokenType.Delimiter,
    );
    if (!lineBreakEndResult) {
        return unexpectedEof(
            tokens,
            index,
            'Unable to find end closing quotes for block code ' +
                '(internal error)',
        );
    }

    const endToken = endTokenResult.token;
    const latexNode: LatexNode | FormulaNode = {
        type:
            latexTarget === LatexTarget.Raw ? NodeType.Latex : NodeType.Formula,
        pos: {
            start: token.pos,
            end: endToken.pos + endToken.text.length,
        },
        text: tokens.tokens
            .slice(lineBreakResult.index + 1, lineBreakEndResult.index)
            .map(v => v.text)
            .join(''),
        parent: tokens.parent,
    };

    if (
        ([LatexTarget.Math, LatexTarget.Raw] as string[]).indexOf(
            latexTarget,
        ) === -1
    ) {
        diagnostic.push(
            nodeToDiagnose(
                latexNode,
                DiagnoseSeverity.Warning,
                DiagnoseErrorType.ApplyParserError,
                'Expected target (label) should be ' +
                    `"${LatexTarget.Math}" or "${LatexTarget.Raw}". ` +
                    `Using default value: "${LatexTarget.Math}"`,
            ),
        );
    }

    return {
        nodes: [latexNode],
        index: endTokenResult.index + 1,
        diagnostic: diagnostic,
    };
};
