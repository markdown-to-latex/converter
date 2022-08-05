import { FileNode, Node, NodeAbstract, NodeType, TextNode } from './struct';

interface NodeWithProbChildren {
    children?: Node[];
    rows?: Node[];
    header?: Node[];
    name?: Node[];
    posArgs?: Node[][];
    keys?: Record<string, TextNode>;
    keyArgs?: Record<string, Node[]>;
    opcode?: Node | null;
    label?: Node | null;
    href?: Node | string | null;
}

const nodeListProcessors = [
    node =>
        Object.prototype.hasOwnProperty.call(node, 'children')
            ? [node.children ?? []]
            : null,
    node =>
        Object.prototype.hasOwnProperty.call(node, 'rows')
            ? [node.rows ?? []]
            : null,
    node =>
        Object.prototype.hasOwnProperty.call(node, 'header')
            ? [node.header ?? []]
            : null,
    node =>
        Object.prototype.hasOwnProperty.call(node, 'name')
            ? [node.name ?? []]
            : null,
    node =>
        Object.prototype.hasOwnProperty.call(node, 'posArgs')
            ? node.posArgs ?? []
            : null,
    node =>
        Object.prototype.hasOwnProperty.call(node, 'keys')
            ? Object.values(node.keys ?? {}).map(n => [n])
            : null,
    node =>
        Object.prototype.hasOwnProperty.call(node, 'keyArgs')
            ? Object.values(node.keyArgs ?? {})
            : null,
    node =>
        Object.prototype.hasOwnProperty.call(node, 'opcode')
            ? !!node.opcode
                ? [[node.opcode]]
                : []
            : null,
    node =>
        Object.prototype.hasOwnProperty.call(node, 'label')
            ? !!node.label
                ? [[node.label]]
                : []
            : null,
    node =>
        Object.prototype.hasOwnProperty.call(node, 'href') &&
        typeof node.href !== 'string'
            ? !!node.href
                ? [[node.href]]
                : []
            : null,
] as ((node: NodeWithProbChildren) => NodeAbstract[][] | null)[];

export interface NodeParentData {
    node: Node;
    index: number;
    container: Node[];
}

export function* traverseNodeChildren(
    originalNode: Readonly<NodeAbstract>,
): Generator<NodeParentData, void, never> {
    const parent = originalNode as NodeWithProbChildren;

    const childrenContainers = nodeListProcessors
        .map(fun => fun(parent))
        .filter<NodeAbstract[][]>(
            (n: NodeAbstract[][] | null): n is NodeAbstract[][] => !!n,
        )
        .flatMap(n => n) as Node[][];

    for (const container of childrenContainers) {
        for (let i = 0; i < container.length; i++) {
            let child = container[i] as Node;
            yield {
                node: child,
                index: i,
                container: container,
            };

            if (child !== container[i]) {
                --i;
            }
        }
    }
}

function* __traverseNodeChildrenDeepDepth(
    originalNode: Readonly<Node>,
    index: number,
    container: Node[],
): Generator<NodeParentData, void, never> {
    yield {
        node: originalNode,
        index: index,
        container: container,
    };

    const iter = traverseNodeChildren(originalNode);
    let value = iter.next();
    while (!value.done) {
        const data = value.value;

        const innerIter = __traverseNodeChildrenDeepDepth(
            data.node,
            data.index,
            data.container,
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
    const iter = __traverseNodeChildrenDeepDepth(originalNode, 0, []);
    let value = iter.next();
    while (!value.done) {
        yield value.value;
        value = iter.next();
    }
}

export function getNodeAllChildren(originalNode: Readonly<Node>): Node[] {
    return Array.from(traverseNodeChildren(originalNode)).map(
        data => data.node,
    );
}

// TODO: also look at children
export function getNodeLeftNeighbourLeaf(node: NodeAbstract): Node | null {
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
        let left = data.container[data.index - 1] as NodeWithProbChildren &
            Node;

        while (
            left &&
            left.children !== undefined &&
            left.children.length !== 0
        ) {
            const child = left.children[left.children.length - 1];
            left = child as NodeWithProbChildren & Node;
        }

        return left;
    }

    return getNodeLeftNeighbourLeaf(parent);
}

export function getNodeRightNeighbourLeaf(
    node: NodeAbstract,
): NodeAbstract | null {
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
        let right = data.container[data.index + 1] as NodeWithProbChildren &
            Node;

        while (
            right &&
            right.children !== undefined &&
            right.children.length !== 0
        ) {
            const child = right.children[0];
            right = child as NodeWithProbChildren & Node;
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

export function getNodeParentFile(node: NodeAbstract): FileNode | null {
    let n: NodeAbstract | null = node;
    while (n) {
        if (n.type === NodeType.File) {
            return n as FileNode;
        }
        n = n.parent;
    }

    return null;
}
