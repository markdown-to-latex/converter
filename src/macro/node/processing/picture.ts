import {
    ImageProcessedNode,
    ProcessedNodeType,
    ProcessingInfo,
    ProcessingInfoCallback,
} from '../struct';
import { fallbackNameNodes } from '../utils';
import {
    DiagnoseErrorType,
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../../../diagnose';
import {ImageNode, NodeType} from "../../../ast/node";

function fallbackImageNode(imageNode: ImageNode): ImageProcessedNode {
    return {
        ...imageNode,

        type: ProcessedNodeType.ImageProcessed,
        name: fallbackNameNodes(imageNode),
        label: 'unknown-picture-1',
    };
}

const callback: ProcessingInfoCallback<ImageNode> = function (ctx, data) {
    const imageNode = data.node.n;

    if (!(imageNode.name && (imageNode.height || imageNode.width))) {
        ctx.c.diagnostic.push(
            nodeToDiagnose(
                imageNode,
                DiagnoseSeverity.Error,
                DiagnoseErrorType.MacrosError,
                'Image must have name and dimension argument',
            ),
        );
        return [fallbackImageNode(imageNode)];
    }

    return [
        {
            ...imageNode,

            type: ProcessedNodeType.TableProcessed,
            name: [...imageNode.name],
            label: imageNode.label,
        },
    ];
};

export default {
    type: NodeType.Image,
    callback: callback,
} as ProcessingInfo<ImageNode>;
