import {
    CodeProcessedNode,
    ProcessedNodeType,
    ProcessingInfo,
    ProcessingInfoCallback,
} from '../struct';
import {
    CodeNode,
    Node,
    NodeAbstract,
    NodeType,
    TextNode,
} from '../../../ast/node';
import { fallbackNameNodes } from '../utils';
import {
    DiagnoseErrorType,
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../../../diagnose';

function fallbackCodeNode(codeNode: CodeNode): CodeProcessedNode {
    const labelNode: TextNode = {
        type: NodeType.Text,
        parent: null,
        pos: codeNode.label?.pos ?? {
            start: codeNode.pos.start,
            end: codeNode.pos.start,
        },
        text: codeNode.label?.text ?? 'unknown-code-1',
    };
    const fallbackCodeNode: CodeProcessedNode = {
        ...codeNode,

        type: ProcessedNodeType.CodeProcessed,
        name: fallbackNameNodes(codeNode),
        label: labelNode,
        lang: 'text',
        index: -1,
    };
    labelNode.parent = fallbackCodeNode as NodeAbstract;

    return fallbackCodeNode;
}

const callback: ProcessingInfoCallback<CodeNode> = function (ctx, data) {
    const codeNode = data.node.n;

    if (!(codeNode.label && codeNode.name)) {
        ctx.c.diagnostic.push(
            nodeToDiagnose(
                codeNode,
                DiagnoseSeverity.Error,
                DiagnoseErrorType.MacrosError,
                'Code must have @name and @label argument',
            ),
        );
        return [fallbackCodeNode(codeNode)];
    }
    const index = ctx.createPictureLabelData({
        label: codeNode.label,
        name: codeNode.name,
    });

    return [
        {
            ...codeNode,

            type: ProcessedNodeType.CodeProcessed,
            name: [...codeNode.name],
            label: codeNode.label,
            index,
        },
    ];
};

export default {
    type: NodeType.Code,
    callback: callback,
} as ProcessingInfo<CodeNode>;
