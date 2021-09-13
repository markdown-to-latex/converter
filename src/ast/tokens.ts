import * as nodes from './nodes';

export interface NodeByTokenType {
    text: nodes.TextNode;
    paragraph: nodes.ParagraphNode;
    code: nodes.CodeNode;
    table: nodes.TableNode;
    br: nodes.BrNode;
    blockquote: nodes.BlockquoteNode;
    def: nodes.DefNode;
    del: nodes.DelNode;
    em: nodes.EmNode;
    html: nodes.HtmlNode;
    codespan: nodes.CodeSpanNode;
    hr: nodes.HrNode;
    escape: nodes.EscapeNode;
    heading: nodes.HeadingNode;
    image: nodes.ImageNode;
    link: nodes.LinkNode;
    list: nodes.ListNode;
    space: nodes.SpaceNode;
    strong: nodes.StrongNode;
    list_item: nodes.ListItemNode;
}
