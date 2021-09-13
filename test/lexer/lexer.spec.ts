import { lexer } from '../../src';
import * as marked from 'marked';

describe('with no custom tokens (is not broken)', function () {
    test('simple text lexer', function () {
        const result = lexer('simple text');
        expect(result).toHaveLength(1);
        expect(result[0].type).toEqual('paragraph');

        const paragraph = result[0] as marked.Tokens.Paragraph;
        expect(paragraph.text).toEqual('simple text');
        expect(paragraph.raw).toEqual('simple text');
        expect(paragraph.tokens).toHaveLength(1);
        expect(paragraph.tokens[0].type).toEqual('text');

        const text = paragraph.tokens[0] as marked.Tokens.Text;
        expect(text.text).toEqual('simple text');
        expect(text.raw).toEqual('simple text');
    });

    test('complex text with header and enum lexer', function () {
        const result = lexer(`# Header

Enum:
1. Point one
    - A
    - B\ \ 
next line
    - C
2. Point two`);
        expect(result).toHaveLength(3);
        expect(result[0].type).toEqual('heading');
        expect(result[1].type).toEqual('paragraph');
        expect(result[2].type).toEqual('list');

        const heading = result[0] as marked.Tokens.Heading;
        expect(heading.text).toEqual('Header');

        const paragraph = result[1] as marked.Tokens.Paragraph;
        expect(paragraph.text).toEqual('Enum:');

        const list = result[2] as marked.Tokens.List;
        expect(list.start).toEqual(1);
        expect(list.ordered).toBeTruthy();
        expect(list.items).toHaveLength(2);

        const innerTokens = list.items[0].tokens as [
            marked.Tokens.Text,
            marked.Tokens.List,
        ];
        expect(innerTokens).toHaveLength(2);
        expect(innerTokens[0].type).toEqual('text');
        expect(innerTokens[0].text).toEqual('Point one');

        expect(innerTokens[1].type).toEqual('list');
        expect(innerTokens[1].items).toHaveLength(3);
        expect(innerTokens[1].items[0].type).toEqual('list_item');
        expect(innerTokens[1].items[0].tokens).toHaveLength(1);
        expect(innerTokens[1].items[0].tokens[0].type).toEqual('text');
        expect(innerTokens[1].items[1].type).toEqual('list_item');
        expect(innerTokens[1].items[1].tokens).toHaveLength(1);
        expect(innerTokens[1].items[1].tokens[0].type).toEqual('text');
        expect(innerTokens[1].items[2].type).toEqual('list_item');
        expect(innerTokens[1].items[2].tokens).toHaveLength(1);
        expect(innerTokens[1].items[2].tokens[0].type).toEqual('text');

        expect(list.items[1].tokens).toHaveLength(1);
        expect(list.items[1].tokens[0].type).toEqual('text');
    });
});
