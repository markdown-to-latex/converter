import { FileNode, Node, NodeText, RawNode, RawNodeType } from './struct';
import {
    findNodeData,
    getNodeAllChildren,
    getNodeLeftNeighbourLeaf,
    getNodeParentFile,
    getNodeRightNeighbourLeaf,
    NodeListProps,
    NodeParentData,
    replaceNode,
    traverseNodeChildren,
    traverseNodeChildrenDeepDepth,
} from './function';
import {
    DiagnoseErrorType,
    DiagnoseInfo,
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../../diagnose';
import { StringE } from '../../extension/string';

export interface NodeEParentData<T extends Node = Node> {
    node: NodeE<T>;
    index: number;
    container: Node[];
    property: NodeListProps;
}

export class NodeE<T extends Node = Node> {
    public node: T;

    public constructor(node: T) {
        this.node = node;
    }

    public static from<N extends Node>(node: N | NodeE<N>): NodeE<N> {
        if (node instanceof NodeE<N>) {
            return node;
        }

        return new NodeE<N>(node);
    }

    public get n(): T {
        return this.node;
    }

    public *traverse(): Generator<NodeEParentData, void, never> {
        const iter = traverseNodeChildren(this.node);
        let value = iter.next();
        while (!value.done) {
            yield {
                ...value.value,
                node: NodeE.from(value.value.node),
            };

            value = iter.next();
        }
    }

    public *traverseDeepDepth(): Generator<NodeEParentData, void, never> {
        const iter = traverseNodeChildrenDeepDepth(this.node);
        let value = iter.next();
        while (!value.done) {
            yield {
                ...value.value,
                node: NodeE.from(value.value.node),
            };

            value = iter.next();
        }
    }

    public get allChildren(): NodeE[] {
        return getNodeAllChildren(this.node).map(node => NodeE.from(node));
    }

    public get leftNeighbourLeaf(): NodeE | null {
        return this.getLeftNeighbourLeaf();
    }

    public getLeftNeighbourLeaf<N extends Node = Node>(): NodeE<N> | null {
        let node = getNodeLeftNeighbourLeaf(this.node);
        if (!node) {
            return node;
        }

        return NodeE.from(node as N);
    }

    public get rightNeighbourLeaf(): NodeE | null {
        return this.getLeftNeighbourLeaf();
    }

    public getRightNeighbourLeaf<N extends Node = Node>(): NodeE<N> | null {
        let node = getNodeRightNeighbourLeaf(this.node);
        if (!node) {
            return node;
        }

        return NodeE.from(node as N);
    }

    public get data(): NodeEParentData {
        return this.getData();
    }

    public getData<N extends Node = Node>(): NodeEParentData<N> {
        const data = findNodeData(this.node);
        return {
            ...data,
            node: NodeE.from(data.node as N),
            container: data.container,
        };
    }

    public replace(newNode: Node | NodeE) {
        const node: Node = newNode instanceof NodeE ? newNode.node : newNode;
        return replaceNode(this.node, node);
    }

    public get parentFile(): FileNode | null {
        return getNodeParentFile(this.node);
    }

    public toDiagnose(
        severity: DiagnoseSeverity,
        errorType: DiagnoseErrorType,
        message?: string,
    ): DiagnoseInfo {
        return nodeToDiagnose(this.node, severity, errorType, message);
    }
}
