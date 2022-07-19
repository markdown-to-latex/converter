import {
    ArgInfo,
    ParsedMacrosArguments,
    ParseMacrosArgumentsResult,
} from './args';
import { Context, ContextE } from '../context';
import {Node, NodeE, OpCodeNode} from '../ast/node';

export interface CommandMacrosNodeData {
    node: NodeE<OpCodeNode>;
    index: number;
    container: Node[];
}

export interface CommandMacrosArgsData<T = ParsedMacrosArguments> {
    args: T;
    label?: string;
}

export type CommandInfoCallback<T = ParsedMacrosArguments> = (
    ctx: ContextE,
    data: CommandMacrosNodeData,
    args: CommandMacrosArgsData,
) => Node[];

export interface CommandInfo {
    args: ArgInfo[];
    labelOptional?: boolean;
    name: string;
    callback: CommandInfoCallback;
}
