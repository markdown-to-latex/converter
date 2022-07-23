import { FileNode, Node, NodeType } from '../../ast/node';
import { DiagnoseList } from '../../diagnose';
import { ContextConfig } from '../../printer/context';
import { ContextE } from './extension';
import {NodeProcessed} from "../node/struct";

export interface ContextApplicationInfo {
    title: Node[];
    label: string;
}

export interface ContextApplicationContentInfo extends ContextApplicationInfo {
    content: NodeProcessed[];
}

export interface ContextReferenceInfo {
    label: string;
}

export interface ContextReferenceContentInfo extends ContextReferenceInfo {
    content: NodeProcessed[];
}

export interface ContextPictureInfo {
    label: string;
    name: Node[]
}

export interface ContextTableInfo {
    label: string;
    name: Node[]
}

export interface ContextInfoReference {
    refs: number;
    node: Node;
}

export interface ContextTemp {
    application: ContextApplicationInfo | null;
    reference: ContextReferenceInfo | null;
    table: ContextTableInfo | null;

    /**
     * Current node
     */
    node: Node;
}

export interface ContextDataGeneric<T> {
    /**
     * Relocation (indexes post-processing)
     */
    labels: string[];

    /**
     * Labels to node mapping (for diagnostic positioning)
     */
    labelToRefs: Record<string, ContextInfoReference>;

    /**
     * Mapping labels to object information
     * Fills only if the target object has been defined
     */
    labelToInfo: Record<string, T>;
}

export type ContextApplicationData =
    ContextDataGeneric<ContextApplicationContentInfo>;
export type ContextReferenceData =
    ContextDataGeneric<ContextReferenceContentInfo>;
export type ContextPictureData = ContextDataGeneric<ContextPictureInfo>;
export type ContextTableData = ContextDataGeneric<ContextTableInfo>;

export interface ContextData {
    application: ContextApplicationData;
    reference: ContextReferenceData;
    picture: ContextPictureData;
    table: ContextTableData;
}

export interface Context {
    diagnostic: DiagnoseList;

    data: ContextData;
    temp: ContextTemp;

    // writeDiagnosticList: (this: Context) => void;
    // writeFile: (this: Context, fileName: string, content: string) => void;
}

export function initContext(node: FileNode): Context {
    return {
        temp: {
            node: node,
            application: null,
            reference: null,
            table: null,
        },
        data: {
            application: {
                labels: [],
                labelToRefs: {},
                labelToInfo: {},
            },
            reference: {
                labels: [],
                labelToRefs: {},
                labelToInfo: {},
            },
            picture: {
                labels: [],
                labelToRefs: {},
                labelToInfo: {},
            },
            table: {
                labels: [],
                labelToRefs: {},
                labelToInfo: {},
            },
        },
        diagnostic: [],
    };
}
