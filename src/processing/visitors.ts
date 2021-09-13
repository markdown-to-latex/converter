import { Node, NodeType } from '../ast/nodes';
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
        [NodeType.CodeSpan]: node => {
            return;
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
