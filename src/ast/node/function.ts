import { FileNode, Node, NodeType } from './struct';

const nodeListProps = ['children', 'rows', 'header', 'name'] as const;

export type NodeListProps = typeof nodeListProps[number];

type NodeWithAnyChildren = {
    [ListKey in NodeListProps]?: Node[];
};

export interface NodeParentData {
    node: Node;
    index: number;
    container: Node[];
    property: NodeListProps;
}

export function* traverseNodeChildren(
    originalNode: Readonly<Node>,
): Generator<NodeParentData, void, never> {
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
                property: prop,
            };

            if (child !== toProcess[i]) {
                --i;
            }
        }
    }
}

function* __traverseNodeChildrenDeepDepth(
    originalNode: Readonly<Node>,
    index: number,
    container: Node[],
    property: NodeListProps,
): Generator<NodeParentData, void, never> {
    yield {
        node: originalNode,
        index: index,
        container: container,
        property: property, // a little workaround
    };

    const iter = traverseNodeChildren(originalNode);
    let value = iter.next();
    while (!value.done) {
        const data = value.value;

        const innerIter = __traverseNodeChildrenDeepDepth(
            data.node,
            data.index,
            data.container,
            data.property,
        );
        let innerValue = innerIter.next();
        while (!innerValue.done) {
            yield innerValue.value;
            innerValue = innerIter.next();
        }

        value = iter.next();
    }
}

export function* traverseNodeChildrenDeepDepth(
    originalNode: Readonly<Node>,
): Generator<NodeParentData, void, never> {
    const iter = __traverseNodeChildrenDeepDepth(originalNode, 0, [], 'rows');
    let value = iter.next();
    while (!value.done) {
        yield value.value;
        value = iter.next();
    }
}

export function getNodeAllChildren(originalNode: Readonly<Node>): Node[] {
    const node = originalNode as NodeWithAnyChildren;

    return Array.from(traverseNodeChildren(originalNode)).map(
        data => data.node,
    );
}

// TODO: also look at children
export function getNodeLeftNeighbourLeaf(node: Node): Node | null {
    const parent = node.parent;
    if (parent === null) {
        return null;
    }

    for (const data of Array.from(traverseNodeChildren(parent))) {
        if (data.node !== node) {
            continue;
        }

        if (data.index === 0) {
            return getNodeLeftNeighbourLeaf(parent);
        }
        let left = data.container[data.index - 1] as NodeWithAnyChildren & Node;

        while (
            left &&
            left.children !== undefined &&
            left.children.length !== 0
        ) {
            const child = left.children[left.children.length - 1];
            left = child as NodeWithAnyChildren & Node;
        }

        return left;
    }

    return getNodeLeftNeighbourLeaf(parent);
}

export function getNodeRightNeighbourLeaf(node: Node): Node | null {
    const parent = node.parent;
    if (parent === null) {
        return null;
    }

    for (const data of Array.from(traverseNodeChildren(parent))) {
        if (data.node !== node) {
            continue;
        }

        if (data.index === data.container.length - 1) {
            return getNodeRightNeighbourLeaf(parent);
        }
        let right = data.container[data.index + 1] as NodeWithAnyChildren &
            Node;

        while (
            right &&
            right.children !== undefined &&
            right.children.length !== 0
        ) {
            const child = right.children[0];
            right = child as NodeWithAnyChildren & Node;
        }

        return right;
    }

    return getNodeRightNeighbourLeaf(parent);
}

export function findNodeData(node: Node): NodeParentData {
    const parent = node.parent;
    if (parent === null) {
        throw new Error('Cannot find node data for a root node');
    }

    for (const data of Array.from(traverseNodeChildren(parent))) {
        if (data.node === node) {
            return data;
        }
    }

    throw new Error('Cannot find node data for a root node');
}

export function replaceNode(node: Node, newNode: Node): void {
    const data = findNodeData(node);
    data.container[data.index] = newNode;

    newNode.parent = node.parent;
}

export function getNodeParentFile(node: Node): FileNode | null {
    let n: Node | null = node;
    while (n) {
        if (n.type === NodeType.File) {
            return n as FileNode;
        }
        n = n.parent;
    }

    return null;
}
