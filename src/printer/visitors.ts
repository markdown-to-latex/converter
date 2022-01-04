import {
    findNodeData,
    getNodeRightNeighbourLeaf,
    ListNode,
    Node,
    NodeType,
} from '../ast/nodes';
import { NodesByType } from '../processing/nodes';
import {
    addReferenceByKey,
    Context,
    getOrCreatePictureLabel,
    getOrCreateTableLabel,
} from './context';
import { resolveOpCode } from './opcodes';
import {
    getLatexCode,
    getLatexHeader,
    getLatexImage,
    getLatexInlineMath,
    getLatexListItem,
    getLatexMath,
    getLatexTable,
    prepareTextForLatex,
    prettifyLaTeX,
} from './latex';

type Visitor<T extends Node> = (node: T, context: Context) => string;

export function applyPrinterVisitors(node: Node, context: Context): string {
    const visitor = processingVisitors[node.type] as Visitor<Node>;
    return visitor(node, context);
}

export function printNodeList(
    nodes: readonly Node[],
    context: Context,
    separator: string = '',
): string {
    return nodes
        .map(node => applyPrinterVisitors(node, context))
        .join(separator);
}

export class ProcessingError extends Error {
    constructor(m: string) {
        super(m);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, ProcessingError.prototype);
    }
}

function throwProcessingError(node: Node): string {
    throw new ProcessingError(
        `"${node.type}" node is not available for LaTeX processing`,
    );
}

function isNodeBeforeBoxed(node: Node): boolean {
    let right = getNodeRightNeighbourLeaf(node);

    while (
        right !== null &&
        [NodeType.Space, NodeType.OpCode].indexOf(right.type) !== -1
    ) {
        right = getNodeRightNeighbourLeaf(right);
    }
    if (right === null) {
        return false;
    }

    return (
        [NodeType.Code, NodeType.Table, NodeType.Image].indexOf(right.type) !==
        -1
    );
}

// Editing

const processingVisitors: {
    [Key in keyof NodesByType]: Visitor<NodesByType[Key]>;
} = {
    [NodeType.Space]: () => '\n',
    [NodeType.Code]: (node, context) => {
        if (node.lang === 'ref') {
            addReferenceByKey(context, context.references.key, {
                text: label => `
${label}.\\,${node.text}`,
            });
            return '';
        }

        return getLatexCode(
            getOrCreatePictureLabel(context, context.code.key),
            context.code.label,
            node.lang ?? '',
            node.text,
            isNodeBeforeBoxed(node),
        );
    },
    [NodeType.Heading]: (node, context) => {
        return getLatexHeader(
            printNodeList(node.children, context),
            node.depth,
        );
    },
    [NodeType.Table]: (node, context) => {
        return getLatexTable(
            getOrCreateTableLabel(context, context.table.key),
            context.table.label,
            printNodeList(node.header, context),
            printNodeList(node.rows, context),
            node.header[0].children.length,
        );
    },
    [NodeType.Blockquote]: (node, context) =>
        printNodeList(node.children, context),
    [NodeType.List]: (node, context) => printNodeList(node.children, context),
    [NodeType.ListItem]: (node, context) => {
        let parentList: null | ListNode = null;
        let parent = node.parent;
        let depth = 0;

        while (parent !== null) {
            if (parent.type === NodeType.List) {
                parentList ??= parent as ListNode;
                ++depth;
            }
            parent = parent.parent;
        }
        if (parentList === null) {
            throw new ProcessingError('Cannot find List parent for ListItem');
        }

        const index = findNodeData(node).index;

        return getLatexListItem(
            printNodeList(node.children, context),
            depth,
            index,
            parentList.ordered,
        );
    },
    [NodeType.Paragraph]: (node, context) =>
        printNodeList(node.children, context) + '\n',
    [NodeType.Def]: throwProcessingError,
    [NodeType.Escape]: node => `\\${prepareTextForLatex(node.text)}`,
    [NodeType.Text]: (node, context) => {
        const children = node.children;
        if (children.length === 0) {
            return prepareTextForLatex(node.text);
        }

        return printNodeList(children, context);
    },
    [NodeType.Html]: throwProcessingError,
    [NodeType.Link]: throwProcessingError,
    [NodeType.Image]: (node, context) => {
        return getLatexImage(
            getOrCreatePictureLabel(context, context.picture.key),
            node.text,
            context.picture.height,
            node.href,
            isNodeBeforeBoxed(node),
        );
    },
    [NodeType.Strong]: (node, context) =>
        `\\textbf{${printNodeList(node.children, context)}}`,
    [NodeType.Em]: throwProcessingError,
    [NodeType.Hr]: () => '\n\\pagebreak\n',
    [NodeType.CodeSpan]: (node, context) =>
        context.config.useMonospaceFont ? `\\texttt{${node.text}}` : node.text,
    [NodeType.Br]: () => '\n\n',
    [NodeType.Del]: throwProcessingError,

    [NodeType.File]: (node, context) => {
        let content = printNodeList(node.children, context);
        content = prettifyLaTeX(content);
        context.writeFile(content, node.path, context);

        return content;
    },
    [NodeType.TableCell]: (node, context) =>
        printNodeList(node.children, context),
    [NodeType.TableRow]: (node, context) => {
        return printNodeList(node.children, context, ' & ') + '\\\\ \\hline\n';
    },
    [NodeType.OpCode]: resolveOpCode,
    [NodeType.CodeLatex]: node => node.text,
    [NodeType.InlineLatex]: node => node.text,
    [NodeType.MathLatex]: node => {
        return getLatexMath(node.text);
    },
    [NodeType.MathInlineLatex]: node => {
        return getLatexInlineMath(prepareTextForLatex(node.text));
    },
};
