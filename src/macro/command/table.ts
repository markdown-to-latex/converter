import { CommandInfo, CommandInfoCallback } from '../struct';
import { Node } from '../../ast/node';
import { ArgInfoType } from '../args';
import {
    DiagnoseErrorType,
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../../diagnose';

interface ArgsType {
    name?: Node[];
}

const callback: CommandInfoCallback<ArgsType, string> = function (
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
