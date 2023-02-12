import {
    ArgInfo,
    ParsedMacrosArguments,
    ParseMacrosArgumentsResult,
} from './args';
import { Context, ContextE } from './context';
import { Node, NodeE, OpCodeNode, TextNode } from '../ast/node';
import { NodeProcessed } from './node/struct';
import { DiagnoseList } from '../diagnostic';

export interface CommandMacrosNodeData {
    node: NodeE<OpCodeNode>;
    index: number;
    container: Node[];
}

export interface CommandMacrosArgsData<
    T = ParsedMacrosArguments,
    LT = TextNode | undefined,
> {
    args: T;
    label: LT;
}

export type CommandInfoCallback<
    T = ParsedMacrosArguments,
    LT = TextNode | undefined,
> = (
    ctx: ContextE,
    data: CommandMacrosNodeData,
    args: CommandMacrosArgsData<T, LT>,
) => NodeProcessed[];

export type NodeUnpacker = (data: CommandMacrosNodeData) => {
    result: boolean;
    diagnostic: DiagnoseList;
};

export interface CommandInfo {
    /**
     * Command arguments information
     */
    args: ArgInfo[];
    /**
     * Is the label optional. If false, the label is required
     */
    labelOptional?: boolean;
    /**
     * Command name
     */
    name: string;
    /**
     * Command processing function
     */
    callback: CommandInfoCallback;
    /**
     * Pre-processing function, that unpacks the raw macro node.
     * The unpacker function MUST check is the node already unpacked
     */
    unpacker?: NodeUnpacker;
}
