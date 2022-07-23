import {CommandInfo, CommandInfoCallback} from '../struct';
import {ProcessedNodeType, ReferenceKeyNode} from "../node/struct";

interface ArgsType {
}

const callback: CommandInfoCallback<ArgsType, string> = function (
    ctx,
    data,
    args,
) {
    const index = ctx.getReferenceLabelIndex(args.label);

    // FEATURE_REQUEST: Multiple labels

    const textNode: ReferenceKeyNode = {
        type: ProcessedNodeType.ReferenceKey,
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
    name: 'RK',
    callback: callback,
} as CommandInfo;
