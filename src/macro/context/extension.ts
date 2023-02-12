import {
    Context,
    ContextApplicationContentInfo,
    ContextFormulaInfo,
    ContextPictureInfo,
    ContextReferenceContentInfo,
    ContextTableInfo,
} from './struct';
import {
    createContextApplication,
    createContextFormulaLabel,
    createContextFormulaLabelData,
    createContextPictureLabel,
    createContextPictureLabelData,
    createContextReference,
    createContextTableLabel,
    createContextTableLabelData,
    diagnoseContextAll,
    diagnoseContextUndefinedPictureLabels,
    diagnoseContextUndefinedTableLabels,
    diagnoseContextUnusedApplicationLabels,
    diagnoseContextUnusedPictureLabels,
    diagnoseContextUnusedReferenceLabels,
    diagnoseContextUnusedTableLabels,
    getContextApplicationLabelIndex,
    getContextReferenceLabelIndex,
    getOrCreateContextFormulaLabelIndex,
    getOrCreateContextPictureLabelIndex,
    getOrCreateContextTableLabelIndex,
} from './function';
import { TextNode } from '../../ast/node';

export class ContextE {
    c: Context;

    constructor(c: Context) {
        this.c = c;
    }

    public getOrCreatePictureLabelIndex(label: TextNode): number {
        return getOrCreateContextPictureLabelIndex(this.c, label);
    }

    public createPictureLabel(label: TextNode): number {
        return createContextPictureLabel(this.c, label);
    }

    public createPictureLabelData(data: Readonly<ContextPictureInfo>): number {
        return createContextPictureLabelData(this.c, data);
    }

    public diagnoseUndefinedPictureLabels(): void {
        diagnoseContextUndefinedPictureLabels(this.c);
    }

    public diagnoseUnusedPictureLabels(): void {
        diagnoseContextUnusedPictureLabels(this.c);
    }

    public getOrCreateTableLabelIndex(label: TextNode): number {
        return getOrCreateContextTableLabelIndex(this.c, label);
    }

    public createTableLabel(label: TextNode): number {
        return createContextTableLabel(this.c, label);
    }

    public createTableLabelData(data: Readonly<ContextTableInfo>): number {
        return createContextTableLabelData(this.c, data);
    }

    public diagnoseUndefinedTableLabels(): void {
        diagnoseContextUndefinedTableLabels(this.c);
    }

    public diagnoseUnusedTableLabels(): void {
        diagnoseContextUnusedTableLabels(this.c);
    }

    public getOrCreateFormulaLabelIndex(label: TextNode): number {
        return getOrCreateContextFormulaLabelIndex(this.c, label);
    }

    public createFormulaLabel(label: TextNode): number {
        return createContextFormulaLabel(this.c, label);
    }

    public createFormulaLabelData(data: Readonly<ContextFormulaInfo>): number {
        return createContextFormulaLabelData(this.c, data);
    }

    public getApplicationLabelIndex(label: TextNode): number {
        return getContextApplicationLabelIndex(this.c, label);
    }

    public createApplication(
        data: Readonly<ContextApplicationContentInfo>,
    ): void {
        return createContextApplication(this.c, data);
    }

    public diagnoseUnusedApplicationLabels(): void {
        diagnoseContextUnusedApplicationLabels(this.c);
    }

    public getReferenceLabelIndex(label: TextNode): number {
        return getContextReferenceLabelIndex(this.c, label);
    }

    public createReference(data: Readonly<ContextReferenceContentInfo>): void {
        return createContextReference(this.c, data);
    }

    public diagnoseUnusedReferenceLabels(): void {
        diagnoseContextUnusedReferenceLabels(this.c);
    }

    public diagnoseAll(): void {
        diagnoseContextAll(this.c);
    }
}
