import { getNodeAllChildren, Node } from '../ast/nodes';
import {
    applyProcessingVisitorIfExists,
    getProcessingStages,
} from './visitors';

function traverseAST(root: Node, stage: number) {
    const nodeQueue: Node[] = [];
    nodeQueue.push(root);

    // In-breadth AST traverse
    while (nodeQueue.length !== 0) {
        const node = nodeQueue.pop()!;

        // Apply visitor if exists
        applyProcessingVisitorIfExists(node, stage);

        nodeQueue.push(
            ...getNodeAllChildren(
                node as Parameters<typeof getNodeAllChildren>[0],
            ),
        );
    }
}

export function applyProcessing(root: Node) {
    const stages = getProcessingStages();
    for (let i = 0; i < stages; i++) {
        traverseAST(root, i);
    }
}
