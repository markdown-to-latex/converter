import { CommandInfo, CommandInfoCallback } from '../struct';
import { PictureKeyNode, ProcessedNodeType } from '../node/struct';

interface ArgsType {}

const callback: CommandInfoCallback<ArgsType, string> = function (
    ctx,
    data,
    args,
) {
    const index = ctx.getOrCreatePictureLabelIndex(args.label);

    const textNode: PictureKeyNode = {
        type: ProcessedNodeType.PictureKey,
        index,
        pos: {
            ...data.node.n.pos,
        },
        parent: data.node.n.parent,
    };
    return [textNode];
};

export default {
    args: [],
    name: 'PK',
    callback: callback,
} as CommandInfo;
