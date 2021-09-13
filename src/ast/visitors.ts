import { Token, TokenByType } from '../lexer/tokens';
import { Node, NodeTableAlign, NodeType } from './nodes';
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
        type: NodeType.Br,
        parent: null,
    }),
    paragraph: token => ({
        type: NodeType.Paragraph,
        parent: null,
        pre: token.pre,
        children: astProcessTokenList(token.tokens),
    }),
    text: token => ({
        type: NodeType.Text,
        parent: null,
        text: token.text,
        children:
            token.tokens !== undefined ? astProcessTokenList(token.tokens) : [],
    }),
    codespan: token => ({
        type: NodeType.CodeSpan,
        parent: null,
        text: token.text,
    }),
    code: token => ({
        type: NodeType.Code,
        parent: null,
        text: token.text,
        lang: token.lang ?? null,
        codeBlockStyle: token.codeBlockStyle ?? null,
    }),
    def: token => ({
        type: NodeType.Def,
        parent: null,
        tag: token.tag,
        href: token.href,
        title: token.title,
    }),
    em: token => ({
        type: NodeType.Em,
        parent: null,
        children: astProcessTokenList(token.tokens),
    }),
    blockquote: token => ({
        type: NodeType.Blockquote,
        parent: null,
        children: astProcessTokenList(token.tokens),
    }),
    del: token => ({
        type: NodeType.Del,
        parent: null,
        children: astProcessTokenList(token.tokens),
    }),
    hr: token => ({
        type: NodeType.Hr,
        parent: null,
    }),
    escape: token => ({
        type: NodeType.Escape,
        parent: null,
        text: token.text,
    }),
    space: token => ({
        type: NodeType.Space,
        parent: null,
    }),
    strong: token => ({
        type: NodeType.Strong,
        parent: null,
        children: astProcessTokenList(token.tokens),
    }),
    html: token => ({
        type: NodeType.Html,
        parent: null,
        text: token.text,
        pre: token.pre,
    }),
    image: token => ({
        type: NodeType.Image,
        parent: null,
        title: token.title ?? '',
        text: token.text,
        href: token.href,
    }),
    heading: token => ({
        type: NodeType.Heading,
        parent: null,
        depth: token.depth,
        children: astProcessTokenList(token.tokens),
    }),
    link: token => ({
        type: NodeType.Link,
        parent: null,
        href: token.href,
        title: token.title ?? '',
        children: astProcessTokenList(token.tokens),
    }),
    list_item: token => ({
        type: NodeType.ListItem,
        parent: null,
        task: token.task,
        loose: token.loose,
        checked: token.checked,
        children: astProcessTokenList(token.tokens),
    }),
    list: token => ({
        type: NodeType.List,
        parent: null,
        ordered: token.ordered,
        loose: token.loose,
        start: token.start,
        children: astProcessTokenList(token.items),
    }),
    table: token => ({
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
        header: token.header.map(cell => ({
            type: NodeType.TableCell,
            parent: null,
            children: astProcessTokenList(cell.tokens),
        })),
        rows: token.rows.map(cellList =>
            cellList.map(cell => ({
                type: NodeType.TableCell,
                parent: null,
                children: astProcessTokenList(cell.tokens),
            })),
        ),
    }),
};
