import {
    ArgInfo,
    ParsedMacrosArguments,
    ParseMacrosArgumentsResult,
} from './args';
import { Context, ContextE } from '../context';
import {Node, NodeE, OpCodeNode} from '../ast/node';
import {NodeProcessed} from "./node/struct";

export interface CommandMacrosNodeData {
    node: NodeE<OpCodeNode>;
    index: number;
    container: Node[];
}

export interface CommandMacrosArgsData<T = ParsedMacrosArguments, LT = string | undefined> {
    args: T;
    label: LT;
}

export type CommandInfoCallback<T = ParsedMacrosArguments, LT = string | undefined> = (
    ctx: ContextE,
    data: CommandMacrosNodeData,
    args: CommandMacrosArgsData<T, LT>,
) => NodeProcessed[];

export interface CommandInfo {
    args: ArgInfo[];
    labelOptional?: boolean;
    name: string;
    callback: CommandInfoCallback;
}
