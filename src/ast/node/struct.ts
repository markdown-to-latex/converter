import { StartEndPosition } from './position';
import { Token } from '../parsing/tokenizer';

export const enum RawNodeType {
    Raw = 'Raw',
    Tokens = 'Tokens',
    SoftBreak = 'SoftBreak', // One \n
    ParagraphBreak = 'ParagraphBreak', // Multiple \n
    TextBreak = 'TextBreak', // Two spaces and one \n
}

export const enum NodeType {
    // Default MarkDown Nodes
    Space = 'Space',
    Code = 'Code',
    Heading = 'Heading',
    Table = 'Table',
    TableCell = 'TableCell',
    TableRow = 'TableRow',
    Blockquote = 'Blockquote',
    List = 'List',
    ListItem = 'ListItem',
    Paragraph = 'Paragraph',
    Html = 'HTML',
    Def = 'Def',
    Escape = 'Escape',
    Text = 'Text',
    Link = 'Link',
    Image = 'Image',
    Strong = 'Strong',
    Em = 'Em', // italic
    Hr = 'Hr',
    CodeSpan = 'CodeSpan',
    Br = 'Br',
    Del = 'Del', // through-lined text

    // Custom
    File = 'File',
    TableControlCell = 'TableControlCell',
    TableControlRow = 'TableControlRow',
    OpCode = 'OpCode',
    LatexSpan = 'LatexSpan',
    Latex = 'Latex',
    Formula = 'Formula',
    FormulaSpan = 'FormulaSpan',
    NonBreakingSpace = 'NonBreakingSpace',
    ThinNonBreakingSpace = 'ThinNonBreakingSpace',

    Comment = 'Comment',
}

export const SPAN_NODE_TYPES: NodeType[] = [
    NodeType.Space,
    NodeType.Def,
    NodeType.Escape,
    NodeType.Text,
    NodeType.Link,
    NodeType.Strong,
    NodeType.Em,
    NodeType.CodeSpan,
    NodeType.Br,
    NodeType.Del,
    NodeType.LatexSpan,
    NodeType.FormulaSpan,
    NodeType.Comment,
];

export type StartEndNumberPosition = StartEndPosition<number>;

export interface NodeAbstract {
    type: string;
    parent: Node | null;
    pos: StartEndNumberPosition;
}

export interface Node extends NodeAbstract {
    type: NodeType | RawNodeType;
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

export interface NodeArgs {
    posArgs: Node[][];
    keyArgs: Record<string, Node[]>;
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
    lang?: string;
    name?: Node[];
    label?: string;
}

export interface HeadingNode extends Node, NodeChildren {
    type: NodeType.Heading;
    depth: number;
}

export interface TableNode extends Node {
    type: NodeType.Table;
    header: [TableRowNode, TableControlRowNode];
    rows: (TableRowNode | TableControlRowNode)[];
}

export interface BlockquoteNode extends Node, NodeChildren {
    type: NodeType.Blockquote;
}

export interface ListNode extends Node, NodeChildren {
    type: NodeType.List;
    ordered: boolean;
    start: number | '';
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

export interface TextNode extends Node, NodeText {
    type: NodeType.Text;
}

export interface LinkNode extends Node, NodeHref, NodeChildren {
    type: NodeType.Link;
}

export interface ImageNode extends Node, NodeHref {
    type: NodeType.Image;
    label: string;
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

export const enum NodeTableAlign {
    Default = 'Default',
    Left = 'Left',
    Right = 'Right',
    Center = 'Center',
}

export interface TableControlCellNode extends Node {
    type: NodeType.TableControlCell;
    align?: NodeTableAlign;
    joinRowsUp?: number;
    joinColsRight?: number;
}

export interface TableControlRowNode extends Node, NodeChildren {
    type: NodeType.TableControlRow;
    children: TableControlCellNode[];
}

export interface OpCodeNode extends Node, NodeArgs {
    type: NodeType.OpCode;
    opcode: string;
    label: string | null;
}

export interface LatexNode extends Node, NodeText {
    type: NodeType.Latex;
}

export interface LatexSpanNode extends Node, NodeText {
    type: NodeType.LatexSpan;
}

export interface FormulaNode extends Node, NodeText {
    type: NodeType.Formula;
}

export interface FormulaSpanNode extends Node, NodeText {
    type: NodeType.FormulaSpan;
}

export interface NonBreakingSpaceNode extends Node {
    type: NodeType.NonBreakingSpace;
}

export interface ThinNonBreakingSpaceNode extends Node {
    type: NodeType.ThinNonBreakingSpace;
}

export interface CommentNode extends Node {
    type: NodeType.Comment;
}
