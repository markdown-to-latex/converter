import * as nodes from '../ast/nodes';
import { NodeType } from '../ast/nodes';

const NodesByTypeMap = {
    [NodeType.Space]: {} as nodes.SpaceNode,
    [NodeType.Code]: {} as nodes.CodeNode,
    [NodeType.Heading]: {} as nodes.HeadingNode,
    [NodeType.Table]: {} as nodes.TableNode,
    [NodeType.Blockquote]: {} as nodes.BlockquoteNode,
    [NodeType.List]: {} as nodes.ListNode,
    [NodeType.ListItem]: {} as nodes.ListItemNode,
    [NodeType.Paragraph]: {} as nodes.ParagraphNode,
    [NodeType.Html]: {} as nodes.HtmlNode,
    [NodeType.Def]: {} as nodes.DefNode,
    [NodeType.Escape]: {} as nodes.EscapeNode,
    [NodeType.Text]: {} as nodes.TextNode,
    [NodeType.Link]: {} as nodes.LinkNode,
    [NodeType.Image]: {} as nodes.ImageNode,
    [NodeType.Strong]: {} as nodes.StrongNode,
    [NodeType.Em]: {} as nodes.EmNode,
    [NodeType.Hr]: {} as nodes.HrNode,
    [NodeType.CodeSpan]: {} as nodes.CodeSpanNode,
    [NodeType.Br]: {} as nodes.BrNode,
    [NodeType.Del]: {} as nodes.DelNode,
    [NodeType.File]: {} as nodes.FileNode,
    [NodeType.TableCell]: {} as nodes.TableCellNode,
    [NodeType.OpCode]: {} as nodes.OpCodeNode,
    [NodeType.InlineLatex]: {} as nodes.InlineLatexNode,
    [NodeType.MathLatex]: {} as nodes.MathLatexNode,
} as const;

export type NodesByType = typeof NodesByTypeMap;

// Compile-time interface validation
const _ = NodesByTypeMap as {
    [Key in NodeType]: nodes.Node;
};
