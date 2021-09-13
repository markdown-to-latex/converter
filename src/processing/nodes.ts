import * as nodes from '../ast/nodes';
import { NodeType } from '../ast/nodes';

export interface NodesByType {
    [NodeType.Space]: nodes.SpaceNode;
    [NodeType.Code]: nodes.CodeNode;
    [NodeType.Heading]: nodes.HeadingNode;
    [NodeType.Table]: nodes.TableNode;
    [NodeType.Blockquote]: nodes.BlockquoteNode;
    [NodeType.List]: nodes.ListNode;
    [NodeType.ListItem]: nodes.ListItemNode;
    [NodeType.Paragraph]: nodes.ParagraphNode;
    [NodeType.Html]: nodes.HtmlNode;
    [NodeType.Def]: nodes.DefNode;
    [NodeType.Escape]: nodes.EscapeNode;
    [NodeType.Text]: nodes.TextNode;
    [NodeType.Link]: nodes.LinkNode;
    [NodeType.Image]: nodes.ImageNode;
    [NodeType.Strong]: nodes.StrongNode;
    [NodeType.Em]: nodes.EmNode;
    [NodeType.Hr]: nodes.HrNode;
    [NodeType.CodeSpan]: nodes.CodeSpanNode;
    [NodeType.Br]: nodes.BrNode;
    [NodeType.Del]: nodes.DelNode;
    [NodeType.File]: nodes.FileNode;
    [NodeType.TableCell]: nodes.TableCellNode;
    [NodeType.OpCode]: nodes.OpCodeNode;
    [NodeType.InlineLatex]: nodes.InlineLatexNode;
    [NodeType.MathLatex]: nodes.MathLatexNode;
}
