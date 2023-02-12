import {
    findNodeData,
    getNodeAllChildren,
    Node,
    NodeAbstract,
    NodeType,
    RawNodeType,
    replaceNode,
} from '../ast/node';
import { ProcessedNodeType } from './node';
import {
    DiagnoseErrorType,
    DiagnoseList,
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../diagnostic';
import { NodeUnpacker } from './struct';

export interface ShouldBeInsideNodeWithTypeResult {
    result: boolean;
    diagnostic: DiagnoseList;
}

export function shouldBeInsideNodeWithType(
    node: Node,
    type: (RawNodeType | NodeType | ProcessedNodeType)[],
): ShouldBeInsideNodeWithTypeResult {
    const parent = node.parent as Node | null;
    if (!parent) {
        return {
            result: true,
            diagnostic: [],
        };
    }

    if (type.indexOf(parent.type) == -1) {
        const message = () => {
            const expected = type.join(', ');
            return `The parent node type is invalid. Expected: [${expected}]`;
        };
        return {
            result: false,
            diagnostic: [
                nodeToDiagnose(
                    node,
                    DiagnoseSeverity.Error,
                    DiagnoseErrorType.MacrosError,
                    message(),
                ),
            ],
        };
    }

    return {
        result: true,
        diagnostic: [],
    };
}

export interface UnpackNodeOnceResult {
    result: boolean;
    diagnostic: DiagnoseList;
}

// TODO: move to node file
export function unpackNodeOnce(node: Node): UnpackNodeOnceResult {
    const parent = node.parent;
    const grandparent = parent?.parent;
    if (!parent) {
        return {
            result: false,
            diagnostic: [
                nodeToDiagnose(
                    node,
                    DiagnoseSeverity.Error,
                    DiagnoseErrorType.MacrosError,
                    'Unable to unpack root node',
                ),
            ],
        };
    }
    if (!grandparent) {
        return {
            result: false,
            diagnostic: [
                nodeToDiagnose(
                    node,
                    DiagnoseSeverity.Error,
                    DiagnoseErrorType.MacrosError,
                    'Unable to root child node',
                ),
            ],
        };
    }

    const nodeData = findNodeData(node);
    const parentData = findNodeData(parent);

    parentData.container.splice(parentData.index, 0, node);
    nodeData.container.splice(nodeData.index, 1);
    node.parent = grandparent;

    return {
        result: true,
        diagnostic: [],
    };
}

export const unpackerParagraphOnce: NodeUnpacker = function (data) {
    const node = data.node.n;
    const checkResult = shouldBeInsideNodeWithType(node, [
        NodeType.Paragraph,
        NodeType.File,
    ]);
    if (!checkResult.result) {
        return { result: false, diagnostic: [...checkResult.diagnostic] };
    }
    // Already unpacked
    if (node.parent?.type === NodeType.File) {
        return { result: false, diagnostic: [] };
    }
    const result = unpackNodeOnce(node);
    return {
        result: result.result,
        diagnostic: [...checkResult.diagnostic, ...result.diagnostic],
    };
};
