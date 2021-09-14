import {
    getNodeNeighbours,
    MathLatexNode,
    Node,
    NodeType,
    replaceNode,
    TextNode,
} from '../ast/nodes';
import { NodesByType } from './nodes';
import { captureLatexInline, captureOpCodes } from './custom';

type Visitor<T extends Node> = (node: T) => void;

export function applyProcessingVisitorIfExists(node: Node, stage: number) {
    const atStage = processingVisitors[stage];

    const visitor = atStage[node.type] as Visitor<Node>;
    if (visitor === undefined) {
        return;
    }

    visitor(node);
}

export function getProcessingStages(): number {
    return processingVisitors.length;
}

// Editing

const processingVisitors: {
    [Key in keyof NodesByType]?: Visitor<NodesByType[Key]>;
}[] = [
    {
        [NodeType.Text]: node => {
            if (node.children.length !== 0) {
                return;
            }

            captureOpCodes(node);
        },
        [NodeType.Code]: node => {
            if (node.lang !== 'math') {
                return;
            }

            replaceNode(node, {
                type: NodeType.MathLatex,
                parent: node.parent,
                text: node.text,
            } as MathLatexNode);
        },
        [NodeType.CodeSpan]: node => {
            const { left, right } = getNodeNeighbours(node);
            if (
                !(
                    left !== null &&
                    right !== null &&
                    left.type === NodeType.Text &&
                    right.type === NodeType.Text
                )
            ) {
                return;
            }

            const [leftText, rightText] = [left, right] as [TextNode, TextNode];

            if (
                !(leftText.text.endsWith('$') && rightText.text.startsWith('$'))
            ) {
                return;
            }

            replaceNode(node, {
                type: NodeType.MathLatex,
                parent: node.parent,
                text: node.text,
            } as MathLatexNode);
        },
    },
    {
        [NodeType.Text]: node => {
            if (node.children.length !== 0) {
                return;
            }

            captureLatexInline(node);
        },
    },
];
