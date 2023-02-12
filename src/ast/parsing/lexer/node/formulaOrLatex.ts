import { TokenParser, TokenPredicate } from '../struct';
import { TokenType } from '../../tokenizer';
import { FormulaNode, LatexNode, NodeType, TextNode } from '../../../node';
import {
    findTokenOrNull,
    findTokenOrNullBackward,
    sliceTokenText,
    unexpectedEof,
} from '../index';
import {
    DiagnoseErrorType,
    DiagnoseList,
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../../../../diagnostic';
import { isPrevTokenDelimiter } from './breaks';
import { getMacroLabel } from './macros';

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

    const targetStart = index + 1;
    const lineBreakResult = findTokenOrNull(
        tokens,
        targetStart,
        t => t.type === TokenType.Delimiter,
    );
    if (!lineBreakResult) {
        return unexpectedEof(
            tokens,
            index,
            'Unable to find line break after formula/latex block',
        );
    }

    let argStartIndex: number;
    for (
        argStartIndex = targetStart;
        argStartIndex < lineBreakResult.index;
        ++argStartIndex
    ) {
        // TODO: encapsulate
        const token = tokens.tokens[argStartIndex];
        if (
            [
                TokenType.Letter,
                TokenType.SeparatedSpecial,
                TokenType.JoinableSpecial,
            ].indexOf(token.type) === -1 ||
            token.text === '['
        ) {
            break;
        }
    }

    const targetEnd = argStartIndex;
    const targetEndToken = tokens.tokens[targetEnd - 1];
    const targetNode: TextNode = {
        type: NodeType.Text,
        parent: tokens.parent,
        pos: {
            start: tokens.tokens[targetStart].pos,
            end: targetEndToken.pos + targetEndToken.text.length,
        },
        text: sliceTokenText(tokens, targetStart, targetEnd),
    };

    const labelResult = getMacroLabel(tokens, argStartIndex);
    diagnostic.push(...labelResult.diagnostic);

    const label = labelResult.label ?? undefined;

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

    const codeTextNode: TextNode = {
        type: NodeType.Text,
        parent: tokens.parent,
        pos: {
            start: tokens.tokens[lineBreakResult.index + 1].pos,
            end:
                lineBreakEndResult.token.pos +
                lineBreakEndResult.token.text.length,
        },
        text: tokens.tokens
            .slice(lineBreakResult.index + 1, lineBreakEndResult.index)
            .map(v => v.text)
            .join(''),
    };

    const endToken = endTokenResult.token;
    const latexNode: LatexNode | FormulaNode = {
        target: targetNode,
        type:
            targetNode.text === LatexTarget.Raw
                ? NodeType.Latex
                : NodeType.Formula,
        pos: {
            start: token.pos,
            end: endToken.pos + endToken.text.length,
        },
        text: codeTextNode,
        parent: tokens.parent,
    };

    if (latexNode.type == NodeType.Formula) {
        latexNode.label = label;
    }

    if (label && targetNode.text === LatexTarget.Raw) {
        diagnostic.push(
            nodeToDiagnose(
                label,
                DiagnoseSeverity.Warning,
                DiagnoseErrorType.ApplyParserError,
                'Label for Latex node is not available',
            ),
        );
    }

    targetNode.parent = latexNode;
    codeTextNode.parent = latexNode;

    if (
        ([LatexTarget.Math, LatexTarget.Raw] as string[]).indexOf(
            targetNode.text,
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
