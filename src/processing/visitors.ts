import {
    CodeLatexNode,
    getNodeLeftNeighbourLeaf,
    getNodeRightNeighbourLeaf,
    MathInlineLatexNode,
    MathLatexNode,
    Node,
    NodeType,
    replaceNode,
    TextNode,
} from '../ast/nodes';
import { NodesByType } from './nodes';
import { captureLatexInline, captureOpCodes } from './capture';

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
            if (node.lang === 'math') {
                replaceNode(node, {
                    type: NodeType.MathLatex,
                    parent: node.parent,
                    text: node.text,
                } as MathLatexNode);
            } else if (node.lang === 'latex-inline') {
                replaceNode(node, {
                    type: NodeType.CodeLatex,
                    parent: node.parent,
                    text: node.text,
                } as CodeLatexNode);
            }
        },
        [NodeType.CodeSpan]: node => {
            const [left, right] = [
                getNodeLeftNeighbourLeaf(node),
                getNodeRightNeighbourLeaf(node),
            ];
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
                type: NodeType.MathInlineLatex,
                parent: node.parent,
                text: node.text,
            } as MathInlineLatexNode);
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
