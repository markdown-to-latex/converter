import * as nodes from "../ast/node";
import { NodeType } from "./node";
import { RawNodeType } from "./node";

const RawNodesByTypeMap = {
    [RawNodeType.Raw]: {} as nodes.RawNode,
    [RawNodeType.Tokens]: {} as nodes.TokensNode,
    [RawNodeType.SoftBreak]: {} as nodes.SoftBreakNode,
    [RawNodeType.ParagraphBreak]: {} as nodes.ParagraphBreakNode,
    [RawNodeType.TextBreak]: {} as nodes.TextBreakNode
} as const;

export type RawNodesByType = typeof RawNodesByTypeMap;

// Compile-time interface validation
const _1 = RawNodesByTypeMap as {
    [Key in RawNodeType]: {};
};

const NodesByTypeMap = {
    [NodeType.Code]: {} as nodes.CodeNode,
    [NodeType.Heading]: {} as nodes.HeadingNode,
    [NodeType.Table]: {} as nodes.TableNode,
    [NodeType.TableControlCell]: {} as nodes.TableControlCellNode,
    [NodeType.TableControlRow]: {} as nodes.TableControlRowNode,
    [NodeType.Blockquote]: {} as nodes.BlockquoteNode,
    [NodeType.List]: {} as nodes.ListNode,
    [NodeType.ListItem]: {} as nodes.ListItemNode,
    [NodeType.Paragraph]: {} as nodes.ParagraphNode,
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

    [NodeType.Underline]: {} as nodes.UnderlineNode,
    [NodeType.File]: {} as nodes.FileNode,
    [NodeType.TableCell]: {} as nodes.TableCellNode,
    [NodeType.TableRow]: {} as nodes.TableRowNode,
    [NodeType.OpCode]: {} as nodes.OpCodeNode,
    [NodeType.Latex]: {} as nodes.LatexNode,
    [NodeType.LatexSpan]: {} as nodes.LatexSpanNode,
    [NodeType.Formula]: {} as nodes.FormulaNode,
    [NodeType.FormulaSpan]: {} as nodes.FormulaSpanNode,
    [NodeType.NonBreakingSpace]: {} as nodes.NonBreakingSpaceNode,
    [NodeType.ThinNonBreakingSpace]: {} as nodes.ThinNonBreakingSpaceNode,

    [NodeType.Comment]: {} as nodes.CommentNode
} as const;

export const NodesArray = Object.keys(NodesByTypeMap) as NodeType[];

export type NodesByType = typeof NodesByTypeMap;

// Compile-time interface validation
const _2 = NodesByTypeMap as {
    [Key in NodeType]: nodes.Node;
};
