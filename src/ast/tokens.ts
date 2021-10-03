import * as nodes from './nodes';
import { Token, TokenTypes } from '../lexer/tokens';

const NodeByTokenTypeArray = {
    text: {} as nodes.TextNode,
    paragraph: {} as nodes.ParagraphNode,
    code: {} as nodes.CodeNode,
    table: {} as nodes.TableNode,
    br: {} as nodes.BrNode,
    blockquote: {} as nodes.BlockquoteNode,
    def: {} as nodes.DefNode,
    del: {} as nodes.DelNode,
    em: {} as nodes.EmNode,
    html: {} as nodes.HtmlNode,
    codespan: {} as nodes.CodeSpanNode,
    hr: {} as nodes.HrNode,
    escape: {} as nodes.EscapeNode,
    heading: {} as nodes.HeadingNode,
    image: {} as nodes.ImageNode,
    link: {} as nodes.LinkNode,
    list: {} as nodes.ListNode,
    space: {} as nodes.SpaceNode,
    strong: {} as nodes.StrongNode,
    list_item: {} as nodes.ListItemNode,
};

export type NodeByTokenType = typeof NodeByTokenTypeArray;

// Compile-time interface validation
const _ = NodeByTokenTypeArray as {
    [Key in TokenTypes]: nodes.Node;
};
