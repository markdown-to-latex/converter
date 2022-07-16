import { StartEndPosition } from "./position";
import { Token } from "../parsing/tokenizer";

export const enum RawNodeType {
    Raw = "Raw",
    Tokens = "Tokens",
    SoftBreak = "SoftBreak", // One \n
    ParagraphBreak = "ParagraphBreak", // Multiple \n
    TextBreak = "TextBreak", // Two spaces and one \n
}

export const enum NodeType {
    // From marked
    Space = "Space",
    Code = "Code",
    Heading = "Heading",
    Table = "Table",
    Blockquote = "Blockquote",
    List = "List",
    ListItem = "ListItem",
    Paragraph = "Paragraph",
    Html = "HTML",
    Def = "Def",
    Escape = "Escape",
    Text = "Text",
    Link = "Link",
    Image = "Image",
    Strong = "Strong",
    Em = "Em",      // italic
    Hr = "Hr",
    CodeSpan = "CodeSpan",
    Br = "Br",
    Del = "Del",

    // Custom
    File = "File",
    TableCell = "TableCell",
    TableRow = "TableRow",
    OpCode = "OpCode",
    InlineLatex = "InlineLatex",
    CodeLatex = "CodeLatex",
    MathLatex = "MathLatex",
    MathInlineLatex = "MathInlineLatex",
}

export const enum NodeTableAlign {
    Default = "Default",
    Left = "Left",
    Right = "Right",
    Center = "Center",
}

export type StartEndNumberPosition = StartEndPosition<number>;

export interface Node {
    type: NodeType | RawNodeType;
    parent: Node | null;
    pos: StartEndNumberPosition;
}

export interface NodeChildren {
    children: Node[];
}

export interface NodeText {
    text: string;
}

export interface NodeHref {
    href: string;
}

export interface RawNode extends Node, NodeText {
    type: RawNodeType.Raw;
}

export interface TokensNode extends Node, NodeText {
    type: RawNodeType.Tokens;
    tokens: Token[];
}

export interface SoftBreakNode extends Node {
    type: RawNodeType.SoftBreak;
}

export interface ParagraphBreakNode extends Node {
    type: RawNodeType.ParagraphBreak;
}

export interface TextBreakNode extends Node {
    type: RawNodeType.TextBreak;
}

export interface SpaceNode extends Node {
    type: NodeType.Space;
}

export interface CodeNode extends Node, NodeText {
    type: NodeType.Code;
    codeBlockStyle: "indented" | null;
    lang: string | null;
}

export interface HeadingNode extends Node, NodeChildren {
    type: NodeType.Heading;
    depth: number;
}

export interface TableNode extends Node {
    type: NodeType.Table;
    align: NodeTableAlign[];
    header: [TableRowNode];
    rows: TableRowNode[];
}

export interface BlockquoteNode extends Node, NodeChildren {
    type: NodeType.Blockquote;
}

export interface ListNode extends Node, NodeChildren {
    type: NodeType.List;
    ordered: boolean;
    start: number | "";
    loose: boolean;
}

export interface ListItemNode extends Node, NodeChildren {
    type: NodeType.ListItem;
    task: boolean;
    checked?: boolean;
    loose: boolean;
}

export interface ParagraphNode extends Node, NodeChildren {
    type: NodeType.Paragraph;
    pre?: boolean;
}

export interface HtmlNode extends Node, NodeText {
    type: NodeType.Html;
    pre: boolean;
}

export interface DefNode extends Node, NodeHref {
    type: NodeType.Def;
    tag: string;
    title: string;
}

export interface EscapeNode extends Node, NodeText {
    type: NodeType.Escape;
}

export interface TextNode extends Node, NodeChildren, NodeText {
    type: NodeType.Text;
}

export interface LinkNode extends Node, NodeHref, NodeChildren {
    type: NodeType.Link;
    title: string;
}

export interface ImageNode extends Node, NodeHref, NodeText {
    type: NodeType.Image;
    name?: Node[];
    width?: string;
    height?: string;
}

export interface StrongNode extends Node, NodeChildren {
    type: NodeType.Strong;
}

export interface EmNode extends Node, NodeChildren {
    type: NodeType.Em;
}

export interface CodeSpanNode extends Node, NodeText {
    type: NodeType.CodeSpan;
}

export interface BrNode extends Node {
    type: NodeType.Br;
}

export interface HrNode extends Node {
    type: NodeType.Hr;
}

export interface DelNode extends Node, NodeChildren {
    type: NodeType.Del;
}

export interface FileNode extends Node, NodeChildren {
    type: NodeType.File;
    path: string;
    raw: string;
}

export interface TableCellNode extends Node, NodeChildren {
    type: NodeType.TableCell;
}

export interface TableRowNode extends Node, NodeChildren {
    type: NodeType.TableRow;
    children: TableCellNode[];
}

export interface OpCodeNode extends Node {
    type: NodeType.OpCode;
    opcode: string;
    label: string | null;
    posArgs: Node[][];
    keyArgs: Record<string, Node[]>;
}

export interface CodeLatexNode extends Node, NodeText {
    type: NodeType.CodeLatex;
}

export interface InlineLatexNode extends Node, NodeText {
    type: NodeType.InlineLatex;
}

export interface MathLatexNode extends Node, NodeText {
    type: NodeType.MathLatex;
}

export interface MathInlineLatexNode extends Node, NodeText {
    type: NodeType.MathInlineLatex;
}
