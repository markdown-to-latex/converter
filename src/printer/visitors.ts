import {
    findNodeData,
    getNodeRightNeighbourLeaf,
    ListNode,
    Node,
    NodeType,
} from '../ast/node';
import { NodesByType } from '../processing/nodes';
import {
    addApplicationByKey,
    addReferenceByKey,
    Context,
    createPictureLabel,
    createTableLabel,
    getOrCreatePictureLabel,
} from './context';
import { CodeLanguageTemporary, resolveOpCode } from './opcodes';
import {
    getLatexCode,
    getLatexCodeSpan,
    getLatexImage,
    getLatexInlineMath,
    getLatexLinkText,
    getLatexListItem,
    getLatexMath,
    getLatexTable,
} from './latex/transpile';

import { getLatexHeader, LatexString } from './latex';

type Visitor<T extends Node> = (node: T, context: Context) => string;

export function applyPrinterVisitors(node: Node, context: Context): string {
    const visitor = processingVisitors[node.type as keyof NodesByType] as Visitor<Node>;
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
        [NodeType.Space, NodeType.OpCode].indexOf(right.type as keyof NodesByType) !== -1
        ) {
        right = getNodeRightNeighbourLeaf(right);
    }
    if (right === null) {
        return false;
    }

    return (
        [NodeType.Code, NodeType.Table, NodeType.Image].indexOf(right.type as keyof NodesByType) !==
        -1
    );
}

// Editing

const processingVisitors: {
    [Key in keyof NodesByType]: Visitor<NodesByType[Key]>;
} = {
    [NodeType.Space]: () => '\n',
    [NodeType.Code]: (node, context) => {
        if (node.lang === CodeLanguageTemporary.Reference) {
            if (context.references.current === null) {
                throw new ProcessingError(
                    `Cannot process code with language ${CodeLanguageTemporary.Reference}. No header OpCode !RR`,
                );
            }

            addReferenceByKey(context, context.references.current.key, {
                text: label => `
${label}.\\,${node.text}`,
            });

            context.references.current = null;
            return '';
        }
        if (node.lang === CodeLanguageTemporary.Application) {
            if (context.applications.current === null) {
                throw new ProcessingError(
                    `Cannot process code with language ${CodeLanguageTemporary.Reference}. No header OpCode !RR`,
                );
            }

            const title = context.applications.current.title;
            addApplicationByKey(context, context.applications.current.key, {
                title: title,
                text: label => `
\\pagebreak
\\subtitle{Приложение ${label}}

\\section*{${title}}

${node.text}
`,
            });

            context.applications.current = null;
            return '';
        }

        return getLatexCode(
            {
                codeLabel: getOrCreatePictureLabel(context, context.code.key),
                codeTitle: context.code.label,
                lang: node.lang ?? '',
                text: node.text,
                removeSpace: isNodeBeforeBoxed(node),
            },
            context.config.latex,
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
            {
                tableLabel: createTableLabel(context, context.table.key),
                tableTitle: context.table.label,
                header: printNodeList(node.header, context),
                content: printNodeList(node.rows, context),
                colAmount: node.header[0].children.length,
                removeSpace: isNodeBeforeBoxed(node),
            },
            context.config.latex,
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
            {
                text: printNodeList(node.children, context),
                depth: depth,
                index: index,
                isOrdered: parentList.ordered,
            },
            context.config.latex,
        );
    },
    [NodeType.Paragraph]: (node, context) =>
        printNodeList(node.children, context) + '\n',
    [NodeType.Def]: throwProcessingError,
    [NodeType.Escape]: (node, context) =>
        `\\${new LatexString(node.text, context).prepare(NodeType.Escape).s}`,
    [NodeType.Text]: (node, context) => {
        const children = node.children;
        if (children.length === 0) {
            const latexString = new LatexString(node.text, context).prepare(
                NodeType.Text,
            );
            return latexString.s;
        }

        return printNodeList(children, context);
    },
    [NodeType.Html]: throwProcessingError,
    [NodeType.Link]: (node, context) =>
        getLatexLinkText(
            printNodeList(node.children, context),
            new LatexString(node.href, context).prepare(NodeType.Link).s,
            node.title,
            context.config.latex,
        ),
    [NodeType.Image]: (node, context) => {
        return getLatexImage(
            {
                pictureLabel: createPictureLabel(context, context.picture.key),
                pictureTitle: node.text,
                height: context.picture.height,
                href: node.href,
                removeSpace: isNodeBeforeBoxed(node),
            },
            context.config.latex,
        );
    },
    [NodeType.Strong]: (node, context) =>
        `\\textbf{${printNodeList(node.children, context)}}`,
    [NodeType.Em]: (node, context) =>
        `\\textit{${printNodeList(node.children, context)}}`,
    [NodeType.Hr]: () => '\n\\pagebreak\n',
    [NodeType.CodeSpan]: (node, context) =>
        getLatexCodeSpan(node.text, context.config.latex),
    [NodeType.Br]: () => '\n\n',
    [NodeType.Del]: (node, context) => {
        return '~' + printNodeList(node.children, context) + '~';
    },
    [NodeType.File]: (node, context) => {
        const content = new LatexString(
            printNodeList(node.children, context),
            context,
        ).removeUnnecessaryLineBreaks();
        context.writeFile(content.s, node.path, context);

        return content.s;
    },
    [NodeType.TableCell]: (node, context) =>
        printNodeList(node.children, context),
    [NodeType.TableRow]: (node, context) => {
        return printNodeList(node.children, context, ' & ') + '\\\\ \\hline\n';
    },
    [NodeType.OpCode]: resolveOpCode,
    [NodeType.CodeLatex]: node => node.text,
    [NodeType.InlineLatex]: node => node.text,
    [NodeType.MathLatex]: (node, context) => {
        return getLatexMath(node.text, context.config.latex);
    },
    [NodeType.MathInlineLatex]: (node, context) => {
        return getLatexInlineMath(
            new LatexString(node.text, context).resolveDeReplacements().s,
            context.config.latex,
        );
    },
};
