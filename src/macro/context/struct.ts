import { FileNode, Node, NodeType, TextNode } from '../../ast/node';
import { DiagnoseList } from '../../diagnostic';
import { NodeApplication, NodeProcessed } from '../node';

export interface ContextApplicationInfo {
    title: Node[];
    label: TextNode;
}

export interface ContextApplicationContentInfo extends ContextApplicationInfo {
    content: NodeProcessed & NodeApplication;
}

export interface ContextReferenceInfo {
    label: TextNode;
}

export interface ContextReferenceContentInfo extends ContextReferenceInfo {
    content: Node[];
}

export interface ContextFormulaInfo {
    label: TextNode;
}

export interface ContextPictureInfo {
    label: TextNode;
    name: Node[];
}

export interface ContextTableInfo {
    label: TextNode;
    name: Node[];
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

export function contextDataGenericEmpty(): ContextDataGeneric<any> {
    return {
        labels: [],
        labelToRefs: {},
        labelToInfo: {},
    };
}

export type ContextApplicationData =
    ContextDataGeneric<ContextApplicationContentInfo>;
export type ContextReferenceData =
    ContextDataGeneric<ContextReferenceContentInfo>;
export type ContextFormulaData = ContextDataGeneric<ContextFormulaInfo>;
export type ContextPictureData = ContextDataGeneric<ContextPictureInfo>;
export type ContextTableData = ContextDataGeneric<ContextTableInfo>;

export interface ContextData {
    application: ContextApplicationData;
    reference: ContextReferenceData;
    picture: ContextPictureData;
    table: ContextTableData;
    formula: ContextFormulaData;
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
            application: contextDataGenericEmpty(),
            reference: contextDataGenericEmpty(),
            picture: contextDataGenericEmpty(),
            table: contextDataGenericEmpty(),
            formula: contextDataGenericEmpty(),
        },
        diagnostic: [],
    };
}
