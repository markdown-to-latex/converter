import { CommandInfo, CommandInfoCallback } from '../struct';
import { AllReferencesNode, ProcessedNodeType, ReferenceNode } from '../node';
import { Node, NodeAbstract } from '../../ast/node';

interface ArgsType {}

const callback: CommandInfoCallback<ArgsType, string> = function (
    ctx,
    data,
    args,
) {
    const { labels, labelToInfo } = ctx.c.data.reference;

    const children: ReferenceNode[] = labels
        .map((label, index) => [labelToInfo[label], label, index] as const)
        .map(([info, label, index]) => ({
            type: ProcessedNodeType.Reference,
            pos: {
                start:
                    info.content.length === 0 ? 0 : info.content[0].pos.start,
                end:
                    info.content.length === 0
                        ? 0
                        : info.content[info.content.length - 1].pos.end,
            },
            parent: data.node.n.parent,
            children: info.content as NodeAbstract[] as Node[],
            index,
        }));

    const node: AllReferencesNode = {
        type: ProcessedNodeType.AllReferences,
        pos: {
            ...data.node.n.pos,
        },
        parent: data.node.n.parent,
        children,
    };
    return [node];
};

export default {
    args: [],
    name: 'LAR',
    callback: callback,
    labelOptional: true,
} as CommandInfo;
