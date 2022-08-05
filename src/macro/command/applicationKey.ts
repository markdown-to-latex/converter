import { CommandInfo, CommandInfoCallback } from '../struct';
import { ApplicationKeyNode, ProcessedNodeType } from '../node/struct';
import { TextNode } from '../../ast/node';

interface ArgsType {}

const callback: CommandInfoCallback<ArgsType, TextNode> = function (
    ctx,
    data,
    args,
) {
    const index = ctx.getApplicationLabelIndex(args.label);

    const textNode: ApplicationKeyNode = {
        type: ProcessedNodeType.ApplicationKey,
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
    name: 'AK',
    callback: callback,
} as CommandInfo;
