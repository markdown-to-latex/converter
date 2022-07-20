import { CommandInfo, CommandInfoCallback } from '../struct';
import { NodeType, TextNode } from '../../ast/node';

interface ArgsType {}

const callback: CommandInfoCallback<ArgsType, string> = function (
    ctx,
    data,
    args,
) {
    const index = ctx.getOrCreateTableLabelIndex(args.label);

    const textNode: TextNode = {
        type: NodeType.Text,
        text: index.toString(),
        pos: {
            ...data.node.n.pos,
        },
        parent: data.node.n.parent,
    };
    return [textNode];
};

export default {
    args: [],
    name: 'TK',
    callback: callback,
} as CommandInfo;
