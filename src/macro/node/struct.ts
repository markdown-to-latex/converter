import {CodeNode, ImageNode, Node, NodeE, NodeType, OpCodeNode, TableNode} from '../../ast/node';
import {CommandMacrosNodeData} from '../struct';
import {ContextE} from '../../context';

export interface ProcessingNodeData<T extends Node> {
    node: NodeE<T>;
    index: number;
    container: Node[];
}

export type ProcessingInfoCallback<T extends Node> = (
    ctx: ContextE,
    data: ProcessingNodeData<T>,
) => NodeProcessed[];

export interface ProcessingInfo<T extends Node> {
    type: NodeType;
    callback: ProcessingInfoCallback<T>;
}

export const enum ProcessedNodeType {
    TableProcessed = 'TableProcessed',
    ImageProcessed = 'ImageProcessed',
    CodeProcessed = 'CodeProcessed',
}

export type NodeProcessed = Node<ProcessedNodeType>;

export interface TableProcessedNode
    extends NodeProcessed,
        Omit<TableNode, 'type'> {

    type: ProcessedNodeType.TableProcessed;
    label: string;
    name: Node[];
    width?: string;
    height?: string;
}

export interface ImageProcessedNode
    extends NodeProcessed,
        Omit<ImageNode, 'type'> {

    type: ProcessedNodeType.ImageProcessed;
    label: string;
    name: Node[];
}

export interface CodeProcessedNode
    extends NodeProcessed,
        Omit<CodeNode, 'type'> {

    type: ProcessedNodeType.CodeProcessed;
    label: string;
    name: Node[];
    lang: string;
}
