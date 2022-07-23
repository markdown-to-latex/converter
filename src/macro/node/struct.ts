import {
    CodeNode,
    ImageNode,
    Node,
    NodeChildren,
    NodeE,
    NodeType,
    OpCodeNode,
    TableNode,
} from '../../ast/node';
import { CommandMacrosNodeData } from '../struct';
import { ContextE } from '../../context';

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

    PictureKey = 'PictureKey',
    TableKey = 'TableKey',
    ApplicationKey = 'ApplicationKey',
    ReferenceKey = 'ReferenceKey',

    LatexSpecific = 'LatexSpecific', // TODO

    AllApplications = 'AllApplications',
    AllReferences = 'AllReferences',

    Application = 'Application',
    RawApplication = 'RawApplication',
    PictureApplication = 'PictureApplication',
    CodeApplication = 'CodeApplication',

    Reference = 'Reference',

    // Internal Application nodes
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

export interface PictureKeyNode extends NodeProcessed {
    type: ProcessedNodeType.PictureKey;
    index: number;
}

export interface TableKeyNode extends NodeProcessed {
    type: ProcessedNodeType.TableKey;
    index: number;
}

export interface ApplicationKeyNode extends NodeProcessed {
    type: ProcessedNodeType.ApplicationKey;
    index: number;
}

export interface ReferenceKeyNode extends NodeProcessed {
    type: ProcessedNodeType.ReferenceKey;
    index: number;
}

export interface AllReferencesNode extends NodeProcessed {
    type: ProcessedNodeType.AllReferences;
    children: ReferenceNode[]
}

export interface ReferenceNode extends NodeProcessed, NodeChildren {
    type: ProcessedNodeType.Reference;
    index: number;
}

export interface AllApplicationsNode extends NodeProcessed {
    type: ProcessedNodeType.AllApplications;
    children: ApplicationNode[]
}

export interface ApplicationNode extends NodeProcessed, NodeChildren {
    type: ProcessedNodeType.Application;
    title: Node[];
    index: number;
}

export interface RawApplicationNode extends NodeProcessed, NodeChildren {
    type: ProcessedNodeType.RawApplication;
}

export interface PictureApplicationNode
    extends NodeProcessed,
        Omit<ImageProcessedNode, 'type' | 'name' | 'label'> {
    type: ProcessedNodeType.PictureApplication;
    rotated: boolean;
}

export interface CodeApplicationNode
    extends NodeProcessed {
    type: ProcessedNodeType.CodeApplication;
    columns: number
    lang: string
    directory: string;
    filename: string;
}
