import { lexer } from '../../src';
import { buildMarkdownAST } from '../../src/ast/build';
import { applyProcessing } from '../../src/processing/process';
import {
    InlineLatexNode,
    Node,
    NodeChildren,
    NodeType,
    OpCodeNode,
    ParagraphNode,
    TableNode,
    TextNode,
} from '../../src/ast/nodes';

describe('with tokens', function () {
    test('opcode', function () {
        const lexerResult = lexer(`Line **1**\n!PK[test|1|2|3]\nLine 2`);
        const result = buildMarkdownAST(lexerResult, { filepath: 'filepath' });
        applyProcessing(result);

        expect(result.children).toHaveLength(1);
        expect(result.children[0].type).toEqual(NodeType.Paragraph);

        const paragraph = result.children[0] as ParagraphNode;
        expect(paragraph.children[2].type).toEqual(NodeType.Text);

        const innerText = paragraph.children[2] as TextNode;
        expect(innerText.children[1].type).toEqual(NodeType.OpCode);

        const opCode = innerText.children[1] as OpCodeNode;
        expect(opCode.opcode).toEqual('PK');
        expect(opCode.arguments).toEqual(['test', '1', '2', '3']);
    });

    test('empty opcode', function () {
        const lexerResult = lexer(`!A[]`);
        const result = buildMarkdownAST(lexerResult, { filepath: 'filepath' });
        applyProcessing(result);

        expect(result.children).toHaveLength(1);
        expect(result.children[0].type).toEqual(NodeType.Paragraph);

        const opCode = (
            (result.children[0] as ParagraphNode).children[0] as TextNode
        ).children[0] as OpCodeNode;
        expect(opCode.parent!.type).toEqual(NodeType.Text);
        expect(opCode.type).toEqual(NodeType.OpCode);
        expect(opCode.opcode).toEqual('A');
        expect(opCode.arguments).toEqual([]);
    });

    test('opcode in the table', function () {
        const lexerResult = lexer(`|a|b|\n|---|---|\n|d !A[] d|h !B[1] y|`);
        const result = buildMarkdownAST(lexerResult, { filepath: 'filepath' });
        applyProcessing(result);

        expect(result.children).toHaveLength(1);
        const table = result.children[0] as TableNode;
        expect(table.type).toEqual(NodeType.Table);

        const tableCellText = table.rows[0][1].children[0] as TextNode;
        expect(tableCellText.type).toEqual(NodeType.Text);

        const opCode = tableCellText.children[1] as OpCodeNode;
        expect(opCode.type).toEqual(NodeType.OpCode);
        expect(opCode.opcode).toEqual('B');
        expect(opCode.arguments).toEqual([1]);
    });
});

describe('with latex inline', function () {
    test('latex inline simple', () => {
        const lexerResult = lexer('$$ \\minussingle $$');
        const result = buildMarkdownAST(lexerResult, { filepath: 'filepath' });
        applyProcessing(result);

        const inlineLatex = (
            (result.children[0] as ParagraphNode).children[0] as TextNode
        ).children[0] as InlineLatexNode;
        expect(inlineLatex.type).toEqual(NodeType.InlineLatex);
        expect(inlineLatex.text).toEqual(' \\minussingle ');
    });
});

describe('with latex math', function () {
    test('latex math', () => {
        const lexerResult = lexer('$`a=b`$');
        const result = buildMarkdownAST(lexerResult, { filepath: 'filepath' });
        applyProcessing(result);

        expect(result).toHaveLength(1);
    });
});
