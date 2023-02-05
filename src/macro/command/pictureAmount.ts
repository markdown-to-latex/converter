import { CommandInfo, CommandInfoCallback } from '../struct';
import { Node, TextNode } from '../../ast/node';
import { PictureAmountNode, ProcessedNodeType } from '../node';

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
            type: ProcessedNodeType.PictureAmount,
            pos: { ...data.node.n.pos },
            parent: data.node.n.parent,
            numberLazy: () => ctx.c.data.picture.labels.length,
        } as PictureAmountNode,
    ];
};

export default {
    args: [],
    name: 'PA',
    callback: callback as CommandInfoCallback,
} as CommandInfo;
