import {lexer} from "../../src";
import * as marked from "marked";
import MarkdownIt from "markdown-it";


describe('lexer with no custom tokens', function () {
    test('simple text lexer', function () {
        const result = lexer('simple text');
        expect(result).toHaveLength(1);
        expect(result[0].type).toEqual('paragraph')

        const paragraph = result[0] as marked.Tokens.Paragraph
        expect(paragraph.text).toEqual('simple text');
        expect(paragraph.raw).toEqual('simple text');
        expect(paragraph.tokens).toHaveLength(1);
        expect(paragraph.tokens[0].type).toEqual('text')

        const text = paragraph.tokens[0] as marked.Tokens.Text;
        expect(text.text).toEqual('simple text');
        expect(text.raw).toEqual('simple text');
    })

    test('complex text with header and enum lexer', function () {
        const result = lexer(`# Header

Enum:
1. Point one
    - A
    - B\ \ 
next line
    - C
2. Point two`);
        expect(result).toHaveLength(1);
        expect(result[0].type).toEqual('paragraph')

        const paragraph = result[0] as marked.Tokens.Paragraph
        expect(paragraph.text).toEqual('simple text');
        expect(paragraph.raw).toEqual('simple text');
        expect(paragraph.tokens).toHaveLength(1);
        expect(paragraph.tokens[0].type).toEqual('text')

        const text = paragraph.tokens[0] as marked.Tokens.Text;
        expect(text.text).toEqual('simple text');
        expect(text.raw).toEqual('simple text');
    })

    test('test', function () {
        const result = MarkdownIt().parse(`# Header

Enum:
1. Point one
    - A
        - A1
        - B1   
next line
    - C
2. Point two`, {});
        console.log('aaaa')
    })
});