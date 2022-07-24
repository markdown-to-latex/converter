import { CommandInfo, CommandInfoCallback } from '../struct';
import {
    AllApplicationsNode,
    NodeApplication,
    NodeProcessed,
    ProcessedNodeType,
} from '../node';

interface ArgsType {}

const callback: CommandInfoCallback<ArgsType, string> = function (
    ctx,
    data,
    args,
) {
    const { labels, labelToInfo } = ctx.c.data.application;

    const children: (NodeProcessed & NodeApplication)[] = labels
        .map((label, index) => [labelToInfo[label], label, index] as const)
        .map(([info, label, index]) => ({
            ...info.content,
            index: index,
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
