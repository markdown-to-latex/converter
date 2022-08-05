import {
    Context,
    ContextApplicationContentInfo,
    ContextPictureInfo,
    ContextReferenceContentInfo,
    ContextTableInfo,
} from './struct';
import {
    DiagnoseErrorType,
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../../diagnose';
import { TextNode } from '../../ast/node';

export function getOrCreateContextPictureLabelIndex(
    ctx: Context,
    label: TextNode,
): number {
    const pictureData = ctx.data.picture;
    const index = pictureData.labels.indexOf(label.text);
    if (index !== -1) {
        ++pictureData.labelToRefs[label.text].refs;
        return index;
    }

    return createContextPictureLabel(ctx, label);
}

export function createContextPictureLabel(
    ctx: Context,
    label: TextNode,
): number {
    const pictureData = ctx.data.picture;
    const index = pictureData.labels.indexOf(label.text);
    if (index !== -1) {
        ctx.diagnostic.push(
            nodeToDiagnose(
                ctx.temp.node!,
                DiagnoseSeverity.Warning,
                DiagnoseErrorType.ContextError,
                `Picture with label ${label.text} already exists`,
            ),
        );
        return index;
    }

    pictureData.labelToRefs[label.text] = {
        node: ctx.temp.node,
        refs: 1,
    };
    pictureData.labels.push(label.text);
    return pictureData.labels.length - 1;
}

export function createContextPictureLabelData(
    ctx: Context,
    data: Readonly<ContextPictureInfo>,
): number {
    const pictureData = ctx.data.picture;
    const index = getOrCreateContextPictureLabelIndex(ctx, data.label);
    if (data.label.text in pictureData.labelToInfo) {
        ctx.diagnostic.push(
            nodeToDiagnose(
                ctx.temp.node,
                DiagnoseSeverity.Warning,
                DiagnoseErrorType.ContextError,
                `Picture with label ${data.label.text} already exists`,
            ),
        );
        return index;
    }

    pictureData.labelToInfo[data.label.text] = data;

    return index;
}

export function diagnoseContextUndefinedPictureLabels(ctx: Context): void {
    const pictureData = ctx.data.picture;
    const undefinedLabels = pictureData.labels.filter(
        label => !(label in pictureData.labelToInfo),
    );
    for (const label of undefinedLabels) {
        ctx.diagnostic.push(
            nodeToDiagnose(
                pictureData.labelToRefs[label].node,
                DiagnoseSeverity.Error,
                DiagnoseErrorType.ContextError,
                `Undefined picture label ${label}`,
            ),
        );
    }
}

export function diagnoseContextUnusedPictureLabels(ctx: Context): void {
    const pictureData = ctx.data.picture;
    const unusedLabels = Object.keys(pictureData.labelToInfo)
        .map(label => [pictureData.labelToRefs[label], label] as const)
        .filter(([refInfo, _]) => refInfo.refs === 1);

    for (const [_, label] of unusedLabels) {
        ctx.diagnostic.push(
            nodeToDiagnose(
                pictureData.labelToRefs[label].node,
                DiagnoseSeverity.Warning,
                DiagnoseErrorType.ContextError,
                `Unused picture label ${label}`,
            ),
        );
    }
}

export function getOrCreateContextTableLabelIndex(
    ctx: Context,
    label: TextNode,
): number {
    const tableData = ctx.data.table;
    const index = tableData.labels.indexOf(label.text);
    if (index !== -1) {
        ++tableData.labelToRefs[label.text].refs;
        return index;
    }

    return createContextTableLabel(ctx, label);
}

export function createContextTableLabel(ctx: Context, label: TextNode): number {
    const tableData = ctx.data.table;
    const index = tableData.labels.indexOf(label.text);
    if (index !== -1) {
        ctx.diagnostic.push(
            nodeToDiagnose(
                ctx.temp.node,
                DiagnoseSeverity.Warning,
                DiagnoseErrorType.ContextError,
                `Table with label ${label.text} already exists`,
            ),
        );
        return index;
    }

    tableData.labelToRefs[label.text] = {
        node: ctx.temp.node,
        refs: 1,
    };
    tableData.labels.push(label.text);
    return tableData.labels.length - 1;
}

export function createContextTableLabelData(
    ctx: Context,
    data: Readonly<ContextTableInfo>,
): number {
    const tableData = ctx.data.table;
    const index = getOrCreateContextTableLabelIndex(ctx, data.label);
    if (data.label.text in tableData.labelToInfo) {
        ctx.diagnostic.push(
            nodeToDiagnose(
                ctx.temp.node,
                DiagnoseSeverity.Warning,
                DiagnoseErrorType.ContextError,
                `Table with label ${data.label} already exists`,
            ),
        );
        return index;
    }

    tableData.labelToInfo[data.label.text] = data;
    return index;
}

export function diagnoseContextUndefinedTableLabels(ctx: Context): void {
    const tableData = ctx.data.table;
    const undefinedLabels = tableData.labels.filter(
        label => !(label in tableData.labelToInfo),
    );
    for (const label of undefinedLabels) {
        ctx.diagnostic.push(
            nodeToDiagnose(
                tableData.labelToRefs[label].node,
                DiagnoseSeverity.Error,
                DiagnoseErrorType.ContextError,
                `Undefined table label ${label}`,
            ),
        );
    }
}

export function diagnoseContextUnusedTableLabels(ctx: Context): void {
    const tableData = ctx.data.table;
    const unusedLabels = Object.keys(tableData.labelToInfo)
        .map(label => [tableData.labelToRefs[label], label] as const)
        .filter(([refInfo, _]) => refInfo.refs === 1);

    for (const [_, label] of unusedLabels) {
        ctx.diagnostic.push(
            nodeToDiagnose(
                tableData.labelToRefs[label].node,
                DiagnoseSeverity.Warning,
                DiagnoseErrorType.ContextError,
                `Unused table label ${label}`,
            ),
        );
    }
}

export function getContextApplicationLabelIndex(
    ctx: Context,
    label: TextNode,
): number {
    const applicationData = ctx.data.application;
    if (!(label.text in applicationData.labelToInfo)) {
        ctx.diagnostic.push(
            nodeToDiagnose(
                ctx.temp.node,
                DiagnoseSeverity.Error,
                DiagnoseErrorType.ContextError,
                `Application with ${label.text} does not exist`,
            ),
        );
        return -1;
    }

    const labels = applicationData.labels;
    const labelIndex = labels.indexOf(label.text);
    if (labelIndex !== -1) {
        ++applicationData.labelToRefs[label.text].refs;
        return labelIndex;
    }

    ++applicationData.labelToRefs[label.text].refs;
    labels.push(label.text);
    return labels.length - 1;
}

export function createContextApplication(
    ctx: Context,
    data: Readonly<ContextApplicationContentInfo>,
): void {
    const applicationData = ctx.data.application;
    if (data.label.text in applicationData.labelToInfo) {
        ctx.diagnostic.push(
            nodeToDiagnose(
                ctx.temp.node,
                DiagnoseSeverity.Warning,
                DiagnoseErrorType.ContextError,
                `Application with ${data.label.text} already exist`,
            ),
        );
        return;
    }

    applicationData.labelToRefs[data.label.text] = {
        node: ctx.temp.node,
        refs: 1,
    };
    applicationData.labelToInfo[data.label.text] = data;
}

export function diagnoseContextUnusedApplicationLabels(ctx: Context): void {
    const applicationData = ctx.data.application;
    const unusedLabels = Object.keys(applicationData.labelToInfo)
        .map(label => [applicationData.labelToRefs[label], label] as const)
        .filter(([refInfo, _]) => refInfo.refs === 1);

    for (const [_, label] of unusedLabels) {
        ctx.diagnostic.push(
            nodeToDiagnose(
                applicationData.labelToRefs[label].node,
                DiagnoseSeverity.Warning,
                DiagnoseErrorType.ContextError,
                `Unused application label ${label}`,
            ),
        );
    }
}

export function getContextReferenceLabelIndex(
    ctx: Context,
    label: TextNode,
): number {
    const referenceData = ctx.data.reference;
    if (!(label.text in referenceData.labelToInfo)) {
        ctx.diagnostic.push(
            nodeToDiagnose(
                ctx.temp.node,
                DiagnoseSeverity.Error,
                DiagnoseErrorType.ContextError,
                `Reference with ${label.text} does not exist`,
            ),
        );
        return -1;
    }

    const labels = referenceData.labels;
    const labelIndex = labels.indexOf(label.text);
    if (labelIndex !== -1) {
        ++referenceData.labelToRefs[label.text].refs;
        return labelIndex;
    }

    ++referenceData.labelToRefs[label.text].refs;
    labels.push(label.text);
    return labels.length - 1;
}

export function createContextReference(
    ctx: Context,
    data: Readonly<ContextReferenceContentInfo>,
): void {
    const referenceData = ctx.data.reference;
    if (data.label.text in referenceData.labelToInfo) {
        ctx.diagnostic.push(
            nodeToDiagnose(
                ctx.temp.node,
                DiagnoseSeverity.Warning,
                DiagnoseErrorType.ContextError,
                `Reference with ${data.label.text} already exist`,
            ),
        );
        return;
    }

    referenceData.labelToRefs[data.label.text] = {
        node: ctx.temp.node,
        refs: 1,
    };
    referenceData.labelToInfo[data.label.text] = data;
}

export function diagnoseContextUnusedReferenceLabels(ctx: Context): void {
    const referenceData = ctx.data.reference;
    const unusedLabels = Object.keys(referenceData.labelToInfo)
        .map(label => [referenceData.labelToRefs[label], label] as const)
        .filter(([refInfo, _]) => refInfo.refs === 1);

    for (const [_, label] of unusedLabels) {
        ctx.diagnostic.push(
            nodeToDiagnose(
                referenceData.labelToRefs[label].node,
                DiagnoseSeverity.Warning,
                DiagnoseErrorType.ContextError,
                `Unused reference label ${label}`,
            ),
        );
    }
}

export function diagnoseContextAll(ctx: Context): void {
    diagnoseContextUndefinedPictureLabels(ctx);
    diagnoseContextUnusedPictureLabels(ctx);
    diagnoseContextUndefinedTableLabels(ctx);
    diagnoseContextUnusedTableLabels(ctx);
    diagnoseContextUnusedApplicationLabels(ctx);
    diagnoseContextUnusedReferenceLabels(ctx);
}
