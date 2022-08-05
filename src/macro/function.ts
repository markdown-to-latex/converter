import { ContextE } from './context';
import {
    Node,
    NodeAbstract,
    NodeEParentData,
    NodeType,
    OpCodeNode,
    TextNode,
} from '../ast/node';
import { CommandInfo } from './struct';
import pictureKey from './command/pictureKey';
import { parseMacrosArguments } from './args';
import {
    DiagnoseErrorType,
    diagnoseListHasSeverity,
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../diagnose';
import table from './command/table';
import tableKey from './command/tableKey';
import applicationKey from './command/applicationKey';
import referenceKey from './command/referenceKey';
import listAllApplications from './command/listAllApplications';
import listAllReferences from './command/listAllReferences';
import { NodeProcessed } from './node/struct';
import application from './command/application';
import reference from './command/reference';

function createFallbackNode(node: Node, macroName: string): TextNode {
    return {
        type: NodeType.Text,
        parent: node.parent,
        pos: {
            ...node.pos,
        },
        text: `?${macroName}?`,
    };
}

const ALL_COMMAND_LIST: CommandInfo[] = [
    pictureKey,

    table,
    tableKey,

    ...application,
    applicationKey,
    listAllApplications,

    reference,
    referenceKey,
    listAllReferences,
];

export function parseMacro(
    ctx: ContextE,
    data: NodeEParentData<OpCodeNode>,
): NodeAbstract[] {
    const opCodeNode = data.node.n;
    const macros = opCodeNode.opcode.text.toUpperCase();
    const command = ALL_COMMAND_LIST.find(d => d.name.toUpperCase() === macros);
    if (!command) {
        ctx.c.diagnostic.push(
            nodeToDiagnose(
                opCodeNode,
                DiagnoseSeverity.Error,
                DiagnoseErrorType.MacrosError,
                `Unable to parse macros ${macros}`,
            ),
        );
    }

    return !command
        ? [createFallbackNode(opCodeNode, macros)]
        : applyCommandForMacros(ctx, command, data);
}

function applyCommandForMacros(
    ctx: ContextE,
    command: CommandInfo,
    data: NodeEParentData<OpCodeNode>,
): NodeAbstract[] {
    const opCodeNode = data.node.n;
    const parseResult = parseMacrosArguments(opCodeNode, command.args);
    ctx.c.diagnostic.push(...parseResult.diagnostic);
    if (
        diagnoseListHasSeverity(parseResult.diagnostic, DiagnoseSeverity.Error)
    ) {
        return [];
    }

    if (!command.labelOptional && !opCodeNode.label) {
        ctx.c.diagnostic.push(
            nodeToDiagnose(
                opCodeNode,
                DiagnoseSeverity.Error,
                DiagnoseErrorType.MacrosError,
                `Macros ${command.name} must contain label (in square brackets)`,
            ),
        );
        return [createFallbackNode(opCodeNode, command.name)];
    }

    return command.callback(
        ctx,
        {
            ...data,
        },
        {
            label: opCodeNode.label ?? undefined,
            args: parseResult.result,
        },
    );
}
