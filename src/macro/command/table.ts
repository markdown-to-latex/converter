import { CommandInfo, CommandInfoCallback } from '../struct';
import { Node, NodeType, TextNode } from '../../ast/node';
import { ArgInfoType } from '../args';

interface ArgsType {
    name?: Node[];
}

const callback: CommandInfoCallback<ArgsType, string> = function (
    ctx,
    data,
    args,
) {
    const tableData = {
        label: args.label,
        name: args.args.name!,
    };
    const index = ctx.createTableLabelData(tableData);
    ctx.c.temp.table = tableData;
    return [];
};

export default {
    args: [
        {
            name: 'name',
            type: ArgInfoType.NodeArray,
            optional: false,
            aliases: ['n'],
        },
    ],
    name: 'T',
    callback: callback as CommandInfoCallback,
} as CommandInfo;
