import { CommandInfo, CommandInfoCallback } from '../struct';
import { Node, TextNode } from '../../ast/node';
import { ArgInfoType } from '../args';
import {
    DiagnoseErrorType,
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../../diagnostic';

interface ArgsType {
    name?: Node[];
}

const callback: CommandInfoCallback<ArgsType, TextNode> = function (
    ctx,
    data,
    args,
) {
    if (!args.args.name) {
        ctx.c.diagnostic.push(
            nodeToDiagnose(
                data.node.n,
                DiagnoseSeverity.Fatal,
                DiagnoseErrorType.MacrosError,
                'Table macros name argument is undefined ' + '(internal error)',
            ),
        );

        return [];
    }

    // TODO: check already existing temporary table in the context

    ctx.c.temp.table = {
        label: args.label,
        name: args.args.name,
    };

    return [];
};

export default {
    args: [
        {
            name: 'name',
            aliases: ['n'],
            type: ArgInfoType.NodeArray,
            onlySpans: true,
            optional: false,
        },
    ],
    name: 'T',
    callback: callback as CommandInfoCallback,
} as CommandInfo;
