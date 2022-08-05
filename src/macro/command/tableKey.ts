import { CommandInfo, CommandInfoCallback } from '../struct';
import { ProcessedNodeType, TableKeyNode } from '../node/struct';
import { TextNode } from '../../ast/node';

interface ArgsType {}

const callback: CommandInfoCallback<ArgsType, TextNode> = function (
    ctx,
    data,
    args,
) {
    const index = ctx.getOrCreateTableLabelIndex(args.label);

    const textNode: TableKeyNode = {
        type: ProcessedNodeType.TableKey,
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
    name: 'TK',
    callback: callback,
} as CommandInfo;
