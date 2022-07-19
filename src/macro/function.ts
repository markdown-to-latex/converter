import { ContextE } from '../context';
import {
    Node,
    NodeEParentData,
    NodeType,
    OpCodeNode,
    TextNode,
} from '../ast/node';
import { CommandInfo } from './struct';
import pictureLabel from './command/pictureLabel';
import { parseMacrosArguments } from './args';
import {
    DiagnoseErrorType,
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../diagnose';

const ALL_COMMAND_LIST: CommandInfo[] = [pictureLabel];

export function parseMacro(ctx: ContextE, data: NodeEParentData<OpCodeNode>): Node[] {
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
        ? [
              {
                  type: NodeType.Text,
                  parent: opCodeNode.parent,
                  pos: {
                      ...opCodeNode.pos,
                  },
                  text: `?${macros}?`,
              } as TextNode,
          ]
        : applyCommandForMacros(ctx, command, data);
}

function applyCommandForMacros(
    ctx: ContextE,
    command: CommandInfo,
    data: NodeEParentData<OpCodeNode>,
): Node[] {
    const parseResult = parseMacrosArguments(data.node.n, command.args);
    ctx.c.diagnostic.push(...parseResult.diagnostic);

    return command.callback(
        ctx,
        {
            ...data,
        },
        {
            label: data.node.n.label ?? undefined,
            args: parseResult.result,
        },
    );
}
