import { Node, NodeType } from '../ast/nodes';
import { NodesByType } from '../processing/nodes';

type Visitor<T extends Node> = (node: T) => void;

export function applyPrinterVisitors(node: Node) {
    const visitor = processingVisitors[node.type] as Visitor<Node>;
    visitor(node);
}

export function printerTokenList(
    nodes: readonly Node[],
    separator: string = '',
): string {
    return nodes.map(node => applyPrinterVisitors(node)).join(separator);
}

class ProcessingError extends Error {}

function throwProcessingError(node: Node) {
    throw new ProcessingError(
        `"${node.type}" node is not available for LaTeX processing`,
    );
}

// Editing

const processingVisitors: {
    [Key in keyof NodesByType]: Visitor<NodesByType[Key]>;
} = {
    [NodeType.Text]: node => {
        const children = node.children;
        if (children.length === 0) {
            return node.text;
        }

        return printerTokenList(children);
    },
    [NodeType.Blockquote]: node => {
        return printerTokenList(node.children);
    },
    [NodeType.Paragraph]: node => {
        return printerTokenList(node.children) + '\n';
    },
    [NodeType.Br]: node => {
        return '\n';
    },
    [NodeType.Html]: throwProcessingError,
    [NodeType.Hr]: throwProcessingError,
    [NodeType.Del]: throwProcessingError,
    [NodeType.Def]: throwProcessingError,
};
