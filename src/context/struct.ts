import { Node } from '../ast/node';
import { DiagnoseList } from '../diagnose';
import { ContextConfig } from '../printer/context';

export interface ContextApplicationInfo {
    title: Node[];
    label: string;
}

export interface ContextApplicationContentInfo extends ContextApplicationInfo {
    content: (this: ContextApplicationContentInfo, indexText: Node[]) => Node[];
}

export interface ContextReferenceInfo {
    label: string;
}

export interface ContextReferenceContentInfo extends ContextReferenceInfo {
    content: (this: ContextReferenceContentInfo, indexText: Node[]) => Node[];
}

export interface ContextPictureInfo {
    label: string;
}

export interface ContextTableInfo {
    label: string;
}

export interface ContextInfoReference {
    refs: number;
    node: Node;
}

export interface ContextTemp {
    application: ContextApplicationInfo | null;
    reference: ContextReferenceInfo | null;

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
    labelToRefs: Record<string, ContextInfoReference>

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
    config: ContextConfig;

    data: ContextData;
    temp: ContextTemp;

    writeDiagnosticList: (this: Context) => void;
    writeFile: (this: Context, fileName: string, content: string) => void;
}
