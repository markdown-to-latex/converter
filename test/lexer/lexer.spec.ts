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

describe('with tokens', function () {
    test('opcode', function () {
        const result = lexer(`Line **1**\n!PK[test|1|2|3]\nLine 2`);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            type: 'paragraph',
            raw: 'Line **1**\n!PK[test|1|2|3]\nLine 2',
            text: 'Line **1**\n!PK[test|1|2|3]\nLine 2',
            tokens: [
                {
                    type: 'text',
                    text: 'Line ',
                    raw: 'Line ',
                },
                {
                    type: 'strong',
                    raw: '**1**',
                    text: '1',
                    tokens: [
                        {
                            type: 'text',
                            raw: '1',
                            text: '1',
                        },
                    ],
                },
                {
                    type: 'text',
                    text: '\n',
                    raw: '\n',
                },
                {
                    type: 'custom_opcode',
                    raw: '!PK[test|1|2|3]\n',
                    opcode: 'PK',
                    arguments: ['test', '1', '2', '3'],
                },
                {
                    type: 'text',
                    text: 'Line 2',
                    raw: 'Line 2',
                },
            ],
        });
    });

    test('empty opcode', function () {
        const result = lexer(`!A[]`);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            type: 'paragraph',
            raw: '!A[]',
            text: '!A[]',
            tokens: [
                {
                    type: 'custom_opcode',
                    raw: '!A[]',
                    opcode: 'A',
                    arguments: [],
                },
            ],
        });
    });

    test('opcode in the table', function () {
        const result = lexer(`|a|b|\n|---|---|\n|d !A[] d|h !B[1|2] y|`);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            type: 'table',
            header: [
                {
                    text: 'a',
                    tokens: [
                        {
                            type: 'text',
                            text: 'a',
                            raw: 'a',
                        },
                    ],
                },
                {
                    text: 'b',
                    tokens: [
                        {
                            type: 'text',
                            text: 'b',
                            raw: 'b',
                        },
                    ],
                },
            ],
            align: [null, null],
            rows: [
                [
                    {
                        text: 'd !A[] d',
                        tokens: [
                            {
                                type: 'text',
                                text: 'd ',
                                raw: 'd ',
                            },
                            {
                                type: 'custom_opcode',
                                raw: '!A[]',
                                opcode: 'A',
                                arguments: [],
                            },
                            {
                                type: 'text',
                                text: ' d',
                                raw: ' d',
                            },
                        ],
                    },
                    {
                        text: 'h !B[1',
                        tokens: [
                            {
                                type: 'text',
                                text: 'h !B[1',
                                raw: 'h !B[1',
                            },
                        ],
                    },
                ],
            ],
            raw: '|a|b|\n|---|---|\n|d !A[] d|h !B[1|2] y|',
        });
    });
});

describe('with latex inline', function () {});
