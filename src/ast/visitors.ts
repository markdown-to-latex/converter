import { Token, TokenByType } from '../lexer/tokens';
import { createStartEndTextPos, Node, NodeTableAlign, NodeType } from './node';
import { NodeByTokenType } from './tokens';

export function astProcessTokenList(tokens: readonly Token[]): Node[] {
    const resultList: Node[] = [];
    for (const token of tokens) {
        resultList.push(...astProcessToken(token));
    }

    return resultList;
}

export function astProcessToken(token: Readonly<Token>): Node[] {
    const visitor = astProcessingVisitors[token.type] as Visitor<Token, Node>;

    const result = visitor(token);
    if (Array.isArray(result)) {
        return result;
    }

    return [result];
}

type Visitor<T extends Token, R extends Node> = (token: Readonly<T>) => R | R[];
const astProcessingVisitors: {
    [key in keyof TokenByType]: Visitor<TokenByType[key], NodeByTokenType[key]>;
} = {
    br: token => ({
        pos: {
            start: 0,
            end: 0,
        },
        type: NodeType.Br,
        parent: null,
    }),
    paragraph: token => ({
        pos: {
            start: 0,
            end: 0,
        },
        type: NodeType.Paragraph,
        parent: null,
        pre: token.pre,
        children: astProcessTokenList(token.tokens),
    }),
    text: token => ({
        pos: {
            start: 0,
            end: 0,
        },
        type: NodeType.Text,
        parent: null,
        text: token.text,
        children:
            token.tokens !== undefined ? astProcessTokenList(token.tokens) : [],
    }),
    codespan: token => ({
        pos: {
            start: 0,
            end: 0,
        },
        type: NodeType.CodeSpan,
        parent: null,
        text: token.text,
    }),
    code: token => ({
        pos: {
            start: 0,
            end: 0,
        },
        type: NodeType.Code,
        parent: null,
        text: token.text,
        lang: token.lang ?? null,
        codeBlockStyle: token.codeBlockStyle ?? null,
    }),
    def: token => ({
        pos: {
            start: 0,
            end: 0,
        },
        type: NodeType.Def,
        parent: null,
        tag: token.tag,
        href: token.href,
        title: token.title,
    }),
    em: token => ({
        pos: {
            start: 0,
            end: 0,
        },
        type: NodeType.Em,
        parent: null,
        children: astProcessTokenList(token.tokens),
    }),
    blockquote: token => ({
        pos: {
            start: 0,
            end: 0,
        },
        type: NodeType.Blockquote,
        parent: null,
        children: astProcessTokenList(token.tokens),
    }),
    del: token => ({
        pos: {
            start: 0,
            end: 0,
        },
        type: NodeType.Del,
        parent: null,
        children: astProcessTokenList(token.tokens),
    }),
    hr: token => ({
        pos: {
            start: 0,
            end: 0,
        },
        type: NodeType.Hr,
        parent: null,
    }),
    escape: token => ({
        pos: {
            start: 0,
            end: 0,
        },
        type: NodeType.Escape,
        parent: null,
        text: token.text,
    }),
    space: token => ({
        pos: {
            start: 0,
            end: 0,
        },
        type: NodeType.Space,
        parent: null,
    }),
    strong: token => ({
        pos: {
            start: 0,
            end: 0,
        },
        type: NodeType.Strong,
        parent: null,
        children: astProcessTokenList(token.tokens),
    }),
    html: token => ({
        pos: {
            start: 0,
            end: 0,
        },
        type: NodeType.Html,
        parent: null,
        text: token.text,
        pre: token.pre,
    }),
    image: token => ({
        pos: {
            start: 0,
            end: 0,
        },
        type: NodeType.Image,
        parent: null,
        title: token.title ?? '',
        text: token.text,
        href: token.href,
    }),
    heading: token => ({
        pos: {
            start: 0,
            end: 0,
        },
        type: NodeType.Heading,
        parent: null,
        depth: token.depth,
        children: astProcessTokenList(token.tokens),
    }),
    link: token => ({
        pos: {
            start: 0,
            end: 0,
        },
        type: NodeType.Link,
        parent: null,
        href: token.href,
        title: token.title ?? '',
        children: astProcessTokenList(token.tokens),
    }),
    list_item: token => ({
        pos: {
            start: 0,
            end: 0,
        },
        type: NodeType.ListItem,
        parent: null,
        task: token.task,
        loose: token.loose,
        checked: token.checked,
        children: astProcessTokenList(token.tokens),
    }),
    list: token => ({
        pos: {
            start: 0,
            end: 0,
        },
        type: NodeType.List,
        parent: null,
        ordered: token.ordered,
        loose: token.loose,
        start: token.start,
        children: astProcessTokenList(token.items),
    }),
    table: token => ({
        pos: {
            start: 0,
            end: 0,
        },
        type: NodeType.Table,
        parent: null,
        align: token.align.map(
            value =>
                ({
                    center: NodeTableAlign.Center,
                    left: NodeTableAlign.Left,
                    right: NodeTableAlign.Right,
                    default: NodeTableAlign.Default,
                }[value ?? 'default']),
        ),
        header: [
            {
                pos: {
                    start: 0,
                    end: 0,
                },
                type: NodeType.TableRow,
                parent: null,
                children: token.header.map(cell => ({
                    pos: {
                        start: 0,
                        end: 0,
                    },
                    type: NodeType.TableCell,
                    parent: null,
                    children: astProcessTokenList(cell.tokens),
                })),
            },
        ],
        rows: token.rows.map(cellList => ({
            pos: {
                start: 0,
                end: 0,
            },
            type: NodeType.TableRow,
            parent: null,
            children: cellList.map(cell => ({
                pos: {
                    start: 0,
                    end: 0,
                },
                type: NodeType.TableCell,
                parent: null,
                children: astProcessTokenList(cell.tokens),
            })),
        })),
    }),
};
