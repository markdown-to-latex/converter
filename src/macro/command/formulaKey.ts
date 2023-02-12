import { CommandInfo, CommandInfoCallback } from '../struct';
import { FormulaKeyNode, ProcessedNodeType } from '../node';
import { TextNode } from '../../ast/node';

interface ArgsType {}

const callback: CommandInfoCallback<ArgsType, TextNode> = function (
    ctx,
    data,
    args,
) {
    const index = ctx.getOrCreateFormulaLabelIndex(args.label);

    const textNode: FormulaKeyNode = {
        type: ProcessedNodeType.FormulaKey,
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
    name: 'FK',
    callback: callback,
} as CommandInfo;
