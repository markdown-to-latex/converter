import { CommandInfo, CommandInfoCallback } from '../struct';
import {
    AllApplicationsNode,
    NodeApplication,
    NodeProcessed,
    ProcessedNodeType,
} from '../node';
import { TextNode } from '../../ast/node';
import { unpackerParagraphOnce } from '../unpack';

interface ArgsType {}

const callback: CommandInfoCallback<ArgsType, TextNode> = function (
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
    unpacker: unpackerParagraphOnce,
} as CommandInfo;