import { TokenParser, TokenPredicate } from '../struct';
import { TokenType } from '../../tokenizer';
import { applyVisitors, findTokenOrNull, sliceTokenText } from '../index';
import {
    NodeType,
    RawNodeType,
    TableCellNode,
    TableNode,
    TableRowNode,
    TokensNode,
} from '../../../node';
import { DiagnoseList } from '../../../../diagnose';
import { isPrevTokenDelimiter } from './breaks';

export const isTableLine: TokenPredicate = function (token, index, node) {
    if (!isPrevTokenDelimiter(node.tokens[index], index, node)) {
        return false;
    }

    if (!(token.type === TokenType.SeparatedSpecial && token.text === '|')) {
        return false;
    }

    const delimiter = findTokenOrNull(
        node,
        index,
        n => n.type === TokenType.Delimiter,
    );
    const lineEndTokenIndex = (delimiter?.index ?? node.tokens.length) - 1;
    if (lineEndTokenIndex === index) {
        return false;
    }

    const lineEndToken = node.tokens[lineEndTokenIndex];
    return (
        lineEndToken.type === TokenType.SeparatedSpecial &&
        lineEndToken.text === '|'
    );
};

interface ParseTableLineResult {
    line: TableRowNode | null;
    diagnostic: DiagnoseList;
}

function parseTableLine(
    tokens: TokensNode,
    startIndex: number,
    endIndex: number,
): ParseTableLineResult {
    const startToken = tokens.tokens[startIndex];
    const endToken = tokens.tokens[endIndex];
    if (
        !(
            startToken.type === TokenType.SeparatedSpecial &&
            startToken.text === '|' &&
            endToken.type === TokenType.SeparatedSpecial &&
            endToken.text === '|'
        )
    ) {
        return {
            line: null,
            diagnostic: [],
        };
    }

    const result: ParseTableLineResult = {
        line: {
            type: NodeType.TableRow,
            parent: null,
            pos: {
                start: startToken.pos,
                end: endToken.pos + endToken.text.length,
            },
            children: [],
        },
        diagnostic: [],
    };
    let curIndex = startIndex;
    while (curIndex < endIndex) {
        const nextBar = findTokenOrNull(
            tokens,
            curIndex + 1,
            t => t.type === TokenType.SeparatedSpecial && t.text === '|',
        )!;
        // TODO: handle null

        const cellNode: TableCellNode = {
            type: NodeType.TableCell,
            parent: result.line,
            pos: {
                start: tokens.tokens[curIndex + 1].pos,
                end: tokens.tokens[nextBar.index].pos,
            },
            children: [],
        };

        const partialTokenNode: TokensNode = {
            type: RawNodeType.Tokens,
            tokens: tokens.tokens.slice(curIndex + 1, nextBar.index),
            text: sliceTokenText(tokens, curIndex + 1, nextBar.index),
            parent: cellNode,
            pos: {
                start: tokens.tokens[curIndex + 1].pos,
                end: tokens.tokens[nextBar.index].pos,
            },
        };
        const parseResult = applyVisitors([partialTokenNode]);
        result.diagnostic.push(...parseResult.diagnostic);

        cellNode.children = parseResult.nodes;
        result.line!.children.push(cellNode);

        curIndex = nextBar.index;
    }

    return result;
}

export const parseTable: TokenParser = function (tokens, index) {
    // TODO: parse control rows separately

    const diagnostic: DiagnoseList = [];
    const rows: TableRowNode[] = [];

    let delimiter: ReturnType<typeof findTokenOrNull> | null = null;
    let lineDelimiterIndex: number = index - 1;
    let lastTokenIndex: number = index;

    while (lineDelimiterIndex < tokens.tokens.length) {
        delimiter = findTokenOrNull(
            tokens,
            lineDelimiterIndex + 1,
            n => n.type === TokenType.Delimiter,
        );

        const prevIndex = lineDelimiterIndex + 1;
        lineDelimiterIndex = delimiter?.index ?? tokens.tokens.length;

        const lineResult = parseTableLine(
            tokens,
            prevIndex,
            lineDelimiterIndex - 1,
        );
        diagnostic.push(...lineResult.diagnostic);

        if (!lineResult.line) {
            break;
        }

        lastTokenIndex = lineDelimiterIndex - 1;
        rows.push(lineResult.line);
    }

    if (diagnostic.length !== 0) {
        return {
            diagnostic: diagnostic,
            index: lastTokenIndex + 1,
            nodes: [],
        };
    }
    if (rows.length === 0) {
        return null;
    }

    const endToken = tokens.tokens[lastTokenIndex];
    const tableNode: TableNode = {
        type: NodeType.Table,
        align: [],
        header: [rows[0]],
        rows: rows.slice(1),
        pos: {
            start: tokens.tokens[index].pos,
            end: endToken.pos + endToken.text.length,
        },
        parent: tokens.parent,
    };
    rows.forEach(n => (n.parent = tableNode));

    return {
        nodes: [tableNode],
        index: lastTokenIndex + 1,
        diagnostic: diagnostic,
    };
};
