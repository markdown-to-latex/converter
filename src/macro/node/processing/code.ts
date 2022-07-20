import {
    CodeProcessedNode,
    ProcessedNodeType,
    ProcessingInfo,
    ProcessingInfoCallback,
} from '../struct';
import { CodeNode, NodeType } from '../../../ast/node';
import { fallbackNameNodes } from '../utils';
import {
    DiagnoseErrorType,
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../../../diagnose';

function fallbackCodeNode(codeNode: CodeNode): CodeProcessedNode {
    return {
        ...codeNode,

        type: ProcessedNodeType.CodeProcessed,
        name: fallbackNameNodes(codeNode),
        label: 'unknown-code-1',
        lang: 'text',
    };
}

const callback: ProcessingInfoCallback<CodeNode> = function (ctx, data) {
    const codeNode = data.node.n;

    if (!(codeNode.label && codeNode.name)) {
        ctx.c.diagnostic.push(
            nodeToDiagnose(
                codeNode,
                DiagnoseSeverity.Error,
                DiagnoseErrorType.MacrosError,
                'Code must have @name and label argument',
            ),
        );
        return [fallbackCodeNode(codeNode)];
    }

    return [
        {
            ...codeNode,

            type: ProcessedNodeType.CodeProcessed,
            name: [...codeNode.name],
            label: codeNode.label,
        },
    ];
};

export default {
    type: NodeType.Code,
    callback: callback,
} as ProcessingInfo<CodeNode>;
