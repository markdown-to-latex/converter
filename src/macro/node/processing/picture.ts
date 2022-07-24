import {
    PictureProcessedNode,
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

function fallbackImageNode(imageNode: ImageNode): PictureProcessedNode {
    return {
        ...imageNode,

        type: ProcessedNodeType.PictureProcessed,
        name: fallbackNameNodes(imageNode),
        label: 'unknown-picture-1',
        index: -1,
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
    const index = ctx.createPictureLabelData({
        label: imageNode.label,
        name: imageNode.name
    })

    return [
        {
            ...imageNode,

            type: ProcessedNodeType.PictureProcessed,
            name: [...imageNode.name],
            label: imageNode.label,
            index
        },
    ];
};

export default {
    type: NodeType.Image,
    callback: callback,
} as ProcessingInfo<ImageNode>;
