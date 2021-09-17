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
    MathLatex = 'MathLatex',
}

export const enum NodeTableAlign {
    Default = 'Default',
    Left = 'Left',
    Right = 'Right',
    Center = 'Center',
}

export interface Node {
    type: NodeType;
    parent: Node | null;
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
}

export interface OpCodeNode extends Node {
    type: NodeType.OpCode;
    opcode: string;
    arguments: string[];
}

export interface InlineLatexNode extends Node, NodeText {
    type: NodeType.InlineLatex;
}

export interface MathLatexNode extends Node, NodeText {
    type: NodeType.MathLatex;
}

const nodeListProps = ['children', 'rows', 'header'] as const;

type NodeWithAnyChildren = {
    [ListKey in typeof nodeListProps[number]]?: Node[];
};

export function* traverseNodeChildren(originalNode: Readonly<Node>): Generator<
    {
        node: Node;
        index: number;
        container: Node[];
    },
    void,
    never
> {
    const parent = originalNode as NodeWithAnyChildren;

    for (const prop of nodeListProps) {
        const toProcess = parent[prop];
        if (!Array.isArray(toProcess)) {
            continue;
        }

        for (let i = 0; i < toProcess.length; i++) {
            let child = toProcess[i];
            yield {
                node: child,
                index: i,
                container: toProcess,
            };
        }
    }
}

export function getNodeAllChildren(originalNode: Readonly<Node>): Node[] {
    const node = originalNode as NodeWithAnyChildren;

    return Array.from(traverseNodeChildren(originalNode)).map(
        data => data.node,
    );
}

export function getNodeNeighbours(node: Node): {
    left: Node | null;
    right: Node | null;
} {
    const parent = node.parent;
    if (parent === null) {
        return {
            left: null,
            right: null,
        };
    }

    for (const data of Array.from(traverseNodeChildren(parent))) {
        if (data.node !== node) {
            continue;
        }

        const left: Node | null =
            data.index !== 0 ? data.container[data.index - 1] : null;

        const right: Node | null =
            data.index !== data.container.length - 1
                ? data.container[data.index + 1]
                : null;

        return { right, left };
    }

    return {
        left: null,
        right: null,
    };
}

export function replaceNode(node: Node, newNode: Node): void {
    const parent = node.parent;
    if (parent === null) {
        throw new Error('Cannot replace root node');
    }

    for (const data of Array.from(traverseNodeChildren(parent))) {
        if (data.node !== node) {
            continue;
        }

        data.container[data.index] = newNode;
        return;
    }
}
