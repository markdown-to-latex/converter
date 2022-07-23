import { CommandInfo, CommandInfoCallback } from '../struct';
import {
    AllApplicationsNode,
    ApplicationNode,
    ProcessedNodeType,
} from '../node/struct';
import { Node } from '../../ast/node';

interface ArgsType {}

const callback: CommandInfoCallback<ArgsType, string> = function (
    ctx,
    data,
    args,
) {
    const { labels, labelToInfo } = ctx.c.data.application;

    const children: ApplicationNode[] = labels
        .map((label, index) => [labelToInfo[label], label, index] as const)
        .map(([info, label, index]) => ({
            type: ProcessedNodeType.Application,
            pos: {
                start:
                    info.content.length === 0 ? 0 : info.content[0].pos.start,
                end:
                    info.content.length === 0
                        ? 0
                        : info.content[info.content.length - 1].pos.end,
            },
            parent: data.node.n.parent,
            children: info.content as Node[],
            index,
            title: info.title,
        }));

    const node: AllApplicationsNode = {
        type: ProcessedNodeType.AllApplications,
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
    name: 'LAA',
    callback: callback,
    labelOptional: true,
} as CommandInfo;
