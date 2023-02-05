import { CommandInfo, CommandInfoCallback } from '../struct';
import { Node, TextNode } from '../../ast/node';
import { ProcessedNodeType, TableAmountNode } from '../node';

interface ArgsType {
    name?: Node[];
}

const callback: CommandInfoCallback<ArgsType, TextNode> = function (
    ctx,
    data,
    _args,
) {
    return [
        {
            type: ProcessedNodeType.TableAmount,
            pos: { ...data.node.n.pos },
            parent: data.node.n.parent,
            numberLazy: () => ctx.c.data.table.labels.length,
        } as TableAmountNode,
    ];
};

export default {
    args: [],
    name: 'TA',
    callback: callback as CommandInfoCallback,
} as CommandInfo;
