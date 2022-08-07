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
} from '../../../diagnostic';
import { ImageNode, NodeType, TextNode } from '../../../ast/node';

function fallbackImageNode(imageNode: ImageNode): PictureProcessedNode {
    const labelNode: TextNode = {
        type: NodeType.Text,
        parent: null,
        pos: imageNode.label?.pos ?? {
            start: imageNode.pos.start,
            end: imageNode.pos.start,
        },
        text: imageNode.label?.text ?? 'unknown-picture-1',
    };

    const fallbackPictureNode: PictureProcessedNode = {
        ...imageNode,

        type: ProcessedNodeType.PictureProcessed,
        name: fallbackNameNodes(imageNode),
        label: labelNode,
        index: -1,
    };
    labelNode.parent = fallbackPictureNode;

    return fallbackPictureNode;
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
        name: imageNode.name,
    });

    return [
        {
            ...imageNode,

            type: ProcessedNodeType.PictureProcessed,
            name: [...imageNode.name],
            label: imageNode.label,
            index,
        },
    ];
};

export default {
    type: NodeType.Image,
    callback: callback,
} as ProcessingInfo<ImageNode>;
