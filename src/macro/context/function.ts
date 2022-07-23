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

export function getOrCreateContextPictureLabelIndex(
    ctx: Context,
    label: string,
): number {
    const pictureData = ctx.data.picture;
    const index = pictureData.labels.indexOf(label);
    if (index !== -1) {
        ++pictureData.labelToRefs[label].refs;
        return index;
    }

    return createContextPictureLabel(ctx, label);
}

export function createContextPictureLabel(ctx: Context, label: string): number {
    const pictureData = ctx.data.picture;
    const index = pictureData.labels.indexOf(label);
    if (index !== -1) {
        ctx.diagnostic.push(
            nodeToDiagnose(
                ctx.temp.node!,
                DiagnoseSeverity.Warning,
                DiagnoseErrorType.ContextError,
                `Picture with label ${label} already exists`,
            ),
        );
        return index;
    }

    pictureData.labelToRefs[label] = {
        node: ctx.temp.node,
        refs: 1,
    };
    pictureData.labels.push(label);
    return pictureData.labels.length - 1;
}

export function createContextPictureLabelData(
    ctx: Context,
    data: Readonly<ContextPictureInfo>,
): number {
    const pictureData = ctx.data.picture;
    const index = getOrCreateContextPictureLabelIndex(ctx, data.label);
    if (data.label in pictureData.labelToInfo) {
        ctx.diagnostic.push(
            nodeToDiagnose(
                ctx.temp.node,
                DiagnoseSeverity.Warning,
                DiagnoseErrorType.ContextError,
                `Picture with label ${data.label} already exists`,
            ),
        );
        return index;
    }

    pictureData.labelToInfo[data.label] = data;

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
    label: string,
): number {
    const tableData = ctx.data.table;
    const index = tableData.labels.indexOf(label);
    if (index !== -1) {
        ++tableData.labelToRefs[label].refs;
        return index;
    }

    return createContextTableLabel(ctx, label);
}

export function createContextTableLabel(ctx: Context, label: string): number {
    const tableData = ctx.data.table;
    const index = tableData.labels.indexOf(label);
    if (index !== -1) {
        ctx.diagnostic.push(
            nodeToDiagnose(
                ctx.temp.node,
                DiagnoseSeverity.Warning,
                DiagnoseErrorType.ContextError,
                `Table with label ${label} already exists`,
            ),
        );
        return index;
    }

    tableData.labelToRefs[label] = {
        node: ctx.temp.node,
        refs: 1,
    };
    tableData.labels.push(label);
    return tableData.labels.length - 1;
}

export function createContextTableLabelData(
    ctx: Context,
    data: Readonly<ContextTableInfo>,
): number {
    const tableData = ctx.data.table;
    const index = getOrCreateContextTableLabelIndex(ctx, data.label);
    if (data.label in tableData.labelToInfo) {
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

    tableData.labelToInfo[data.label] = data;
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
    label: string,
): number {
    const applicationData = ctx.data.application;
    if (!(label in applicationData.labelToInfo)) {
        ctx.diagnostic.push(
            nodeToDiagnose(
                ctx.temp.node,
                DiagnoseSeverity.Error,
                DiagnoseErrorType.ContextError,
                `Application with ${label} does not exist`,
            ),
        );
        return -1;
    }

    const labels = applicationData.labels;
    const labelIndex = labels.indexOf(label);
    if (labelIndex !== -1) {
        ++applicationData.labelToRefs[label].refs;
        return labelIndex;
    }

    ++applicationData.labelToRefs[label].refs;
    labels.push(label);
    return labels.length - 1;
}

export function createContextApplication(
    ctx: Context,
    data: Readonly<ContextApplicationContentInfo>,
): void {
    const applicationData = ctx.data.application;
    if (data.label in applicationData.labelToInfo) {
        ctx.diagnostic.push(
            nodeToDiagnose(
                ctx.temp.node,
                DiagnoseSeverity.Warning,
                DiagnoseErrorType.ContextError,
                `Application with ${data.label} already exist`,
            ),
        );
        return;
    }

    applicationData.labelToRefs[data.label] = {
        node: ctx.temp.node,
        refs: 1,
    };
    applicationData.labelToInfo[data.label] = data;
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
    label: string,
): number {
    const referenceData = ctx.data.reference;
    if (!(label in referenceData.labelToInfo)) {
        ctx.diagnostic.push(
            nodeToDiagnose(
                ctx.temp.node,
                DiagnoseSeverity.Error,
                DiagnoseErrorType.ContextError,
                `Reference with ${label} does not exist`,
            ),
        );
        return -1;
    }

    const labels = referenceData.labels;
    const labelIndex = labels.indexOf(label);
    if (labelIndex !== -1) {
        ++referenceData.labelToRefs[label].refs;
        return labelIndex;
    }

    ++referenceData.labelToRefs[label].refs;
    labels.push(label);
    return labels.length - 1;
}

export function createContextReference(
    ctx: Context,
    data: Readonly<ContextReferenceContentInfo>,
): void {
    const referenceData = ctx.data.reference;
    if (data.label in referenceData.labelToInfo) {
        ctx.diagnostic.push(
            nodeToDiagnose(
                ctx.temp.node,
                DiagnoseSeverity.Warning,
                DiagnoseErrorType.ContextError,
                `Reference with ${data.label} already exist`,
            ),
        );
        return;
    }

    referenceData.labelToRefs[data.label] = {
        node: ctx.temp.node,
        refs: 1,
    };
    referenceData.labelToInfo[data.label] = data;
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
