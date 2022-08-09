import { CommandInfo, CommandInfoCallback } from '../struct';
import { ProcessedNodeType } from '../node/struct';
import { Node, TextNode } from '../../ast/node';
import { ArgInfoType } from '../args';
import {
    DiagnoseErrorType,
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../../diagnostic';

interface ArgsType {
    reference?: Node[];
}

const callback: CommandInfoCallback<ArgsType, TextNode> = function (
    ctx,
    data,
    args,
) {
    if (!args.args.reference) {
        ctx.c.diagnostic.push(
            nodeToDiagnose(
                data.node.n,
                DiagnoseSeverity.Fatal,
                DiagnoseErrorType.MacrosError,
                'Reference macros reference argument is undefined ' +
                    '(internal error)',
            ),
        );

        return [];
    }

    ctx.createReference({
        label: args.label,
        content: args.args.reference,
    });
    return [];
};

export default {
    args: [
        {
            name: 'reference',
            aliases: ['r', 'ref'],
            type: ArgInfoType.NodeArray,
            onlySpans: false,
            optional: false,
        },
    ],
    name: 'R',
    callback: callback,
} as CommandInfo;
