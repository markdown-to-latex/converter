export const enum RawNodeType {
    Raw = 'Raw',
}

export const enum NodeType {
    // From marked
    Space = 'Space',
    Code = 'Code',
    Heading = 'Heading',
    Table = 'Table',
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
    Em = 'Em',
    Hr = 'Hr',
    CodeSpan = 'CodeSpan',
    Br = 'Br',
    Del = 'Del',

    // Custom
    File = 'File',
    TableCell = 'TableCell',
    TableRow = 'TableRow',
    OpCode = 'OpCode',
    InlineLatex = 'InlineLatex',
    CodeLatex = 'CodeLatex',
    MathLatex = 'MathLatex',
    MathInlineLatex = 'MathInlineLatex',
}

export const enum NodeTableAlign {
    Default = 'Default',
    Left = 'Left',
    Right = 'Right',
    Center = 'Center',
}

export interface TextPosition {
    line: number;
    column: number;
}

export interface StartEndTextPosition {
    start: TextPosition;
    end: TextPosition;
}

export function textPositionToString(pos: TextPosition) {
    return `${pos.line}:${pos.column}`;
}

export function textPositionEq(
    left: TextPosition,
    right: TextPosition,
): boolean {
    return left.line === right.line && left.column == right.column;
}

export function textPositionG(
    left: TextPosition,
    right: TextPosition,
): boolean {
    return (
        left.line > right.line ||
        (left.line == right.line && left.column > right.column)
    );
}

export function textPositionGEq(
    left: TextPosition,
    right: TextPosition,
): boolean {
    return textPositionEq(left, right) || textPositionG(left, right);
}

export function copyTextPosition(pos: TextPosition): TextPosition {
    return { ...pos };
}

export function createStartEndPos(
    startLine: number,
    startCol: number,
    endLine: number,
    endCol: number,
): StartEndTextPosition {
    return {
        start: {
            line: startLine,
            column: startCol,
        },
        end: {
            line: endLine,
            column: endCol,
        },
    };
}

export function copyStartEndPos(
    pos: StartEndTextPosition,
): StartEndTextPosition {
    return {
        start: copyTextPosition(pos.start),
        end: copyTextPosition(pos.end),
    };
}

export interface Node {
    type: NodeType | RawNodeType;
    parent: Node | null;
    pos: StartEndTextPosition;
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

export interface SpaceNode extends Node {
    type: NodeType.Space;
}

export interface CodeNode extends Node, NodeText {
    type: NodeType.Code;
    codeBlockStyle: 'indented' | null;
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

export interface TextNode extends Node, NodeChildren, NodeText {
    type: NodeType.Text;
}

export interface LinkNode extends Node, NodeHref, NodeChildren {
    type: NodeType.Link;
    title: string;
}

export interface ImageNode extends Node, NodeHref, NodeText {
    type: NodeType.Image;
    title: string;
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
    arguments: string[];
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
