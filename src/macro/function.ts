import { ContextE } from '../context';
import {
    Node,
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
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../diagnose';
import table from "./command/table";
import tableKey from "./command/tableKey";

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
    tableKey
];

export function parseMacro(
    ctx: ContextE,
    data: NodeEParentData<OpCodeNode>,
): Node[] {
    const opCodeNode = data.node.n;
    const macros = opCodeNode.opcode.toUpperCase();
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
): Node[] {
    const opCodeNode = data.node.n;
    const parseResult = parseMacrosArguments(opCodeNode, command.args);
    ctx.c.diagnostic.push(...parseResult.diagnostic);

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
