import { getNodeAllChildren, Node } from '../ast/node';
import {
    applyProcessingVisitorIfExists,
    getProcessingStages,
} from './visitors';
import { Context } from '../printer/context';

function traverseAST(root: Node, context: Context, stage: number) {
    const nodeQueue: Node[] = [];
    nodeQueue.push(root);

    // In-breadth AST traverse
    while (nodeQueue.length !== 0) {
        const node = nodeQueue.pop()!;

        // Apply visitor if exists
        applyProcessingVisitorIfExists(node, context, stage);

        nodeQueue.push(
            ...getNodeAllChildren(
                node as Parameters<typeof getNodeAllChildren>[0],
            ),
        );
    }
}

export function applyProcessing(root: Node, context: Context) {
    const stages = getProcessingStages();
    for (let i = 0; i < stages; i++) {
        traverseAST(root, context, i);
    }
}
