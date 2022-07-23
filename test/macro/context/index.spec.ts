import {
    ContextApplicationContentInfo,
    ContextApplicationInfo,
    ContextE,
    ContextPictureInfo,
    ContextReferenceContentInfo,
    ContextTableInfo,
} from '../../../src/macro/context';
import { Node, NodeType } from '../../../src/ast/node';

function createSimpleContext(): ContextE {
    return new ContextE({
        temp: {
            node: {
                type: NodeType.File,
                pos: {
                    start: 0,
                    end: 1,
                },
                parent: null,
            },
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
        // writeDiagnosticList: () => {},
        // writeFile: () => {},
    });
}

describe('context pictures', () => {
    test('simple', () => {
        const context = createSimpleContext();

        context.createPictureLabelData({
            label: 'pic-3',
        } as any as ContextPictureInfo);
        context.getOrCreatePictureLabelIndex('pic-1');
        context.getOrCreatePictureLabelIndex('pic-2');
        context.getOrCreatePictureLabelIndex('pic-3');
        context.createPictureLabelData({
            label: 'pic-2',
        } as any as ContextPictureInfo);
        context.createPictureLabelData({
            label: 'pic-1',
        } as any as ContextPictureInfo);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(0);
        expect(context.c.data).toMatchSnapshot();
    });

    test('create same key twice', () => {
        const context = createSimpleContext();

        context.createPictureLabelData({
            label: 'pic-1',
        } as any as ContextPictureInfo);
        context.createPictureLabelData({
            label: 'pic-1',
        } as any as ContextPictureInfo);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(1);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data).toMatchSnapshot();
    });

    test('create undefined keys', () => {
        const context = createSimpleContext();

        context.getOrCreatePictureLabelIndex('pic-1');
        context.getOrCreatePictureLabelIndex('pic-3');

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(2);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data).toMatchSnapshot();
    });

    test('create unused keys', () => {
        const context = createSimpleContext();

        context.createPictureLabelData({
            label: 'pic-1',
        } as any as ContextPictureInfo);
        context.createPictureLabelData({
            label: 'pic-2',
        } as any as ContextPictureInfo);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(2);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data).toMatchSnapshot();
    });
});

describe('context tables', () => {
    test('simple', () => {
        const context = createSimpleContext();

        context.createTableLabelData({
            label: 'table-3',
        } as any as ContextTableInfo);
        context.getOrCreateTableLabelIndex('table-1');
        context.getOrCreateTableLabelIndex('table-2');
        context.getOrCreateTableLabelIndex('table-3');
        context.createTableLabelData({
            label: 'table-2',
        } as any as ContextTableInfo);
        context.createTableLabelData({
            label: 'table-1',
        } as any as ContextTableInfo);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(0);
        expect(context.c.data).toMatchSnapshot();
    });

    test('create same key twice', () => {
        const context = createSimpleContext();

        context.createTableLabelData({
            label: 'table-1',
        } as any as ContextTableInfo);
        context.createTableLabelData({
            label: 'table-1',
        } as any as ContextTableInfo);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(1);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data).toMatchSnapshot();
    });

    test('create undefined keys', () => {
        const context = createSimpleContext();

        context.getOrCreateTableLabelIndex('table-1');
        context.getOrCreateTableLabelIndex('table-3');

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(2);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data).toMatchSnapshot();
    });

    test('create unused keys', () => {
        const context = createSimpleContext();

        context.createTableLabelData({
            label: 'table-1',
        } as any as ContextTableInfo);
        context.createTableLabelData({
            label: 'table-2',
        } as any as ContextTableInfo);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(2);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data).toMatchSnapshot();
    });
});

describe('context application', () => {
    test('simple', () => {
        const context = createSimpleContext();

        context.createApplication({
            label: 'app-1',
        } as any as ContextApplicationContentInfo);
        context.createApplication({
            label: 'app-2',
        } as any as ContextApplicationContentInfo);
        expect(context.getApplicationLabelIndex('app-2')).toEqual(0);
        expect(context.getApplicationLabelIndex('app-1')).toEqual(1);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(0);
        expect(context.c.data).toMatchSnapshot();
    });

    test('create same key twice', () => {
        const context = createSimpleContext();

        context.createApplication({
            label: 'app-1',
        } as any as ContextApplicationContentInfo);
        context.createApplication({
            label: 'app-1',
        } as any as ContextApplicationContentInfo);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(2);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data).toMatchSnapshot();
    });

    test('create undefined keys', () => {
        const context = createSimpleContext();

        context.getApplicationLabelIndex('app-1');
        context.getApplicationLabelIndex('app-2');

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(2);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data).toMatchSnapshot();
    });

    test('create unused keys', () => {
        const context = createSimpleContext();

        context.createApplication({
            label: 'app-1',
        } as any as ContextApplicationContentInfo);
        context.createApplication({
            label: 'app-2',
        } as any as ContextApplicationContentInfo);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(2);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data).toMatchSnapshot();
    });
});

describe('context reference', () => {
    test('simple', () => {
        const context = createSimpleContext();

        context.createReference({
            label: 'ref-1',
        } as any as ContextReferenceContentInfo);
        context.createReference({
            label: 'ref-2',
        } as any as ContextReferenceContentInfo);
        expect(context.getReferenceLabelIndex('ref-2')).toEqual(0);
        expect(context.getReferenceLabelIndex('ref-1')).toEqual(1);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(0);
        expect(context.c.data).toMatchSnapshot();
    });

    test('create same key twice', () => {
        const context = createSimpleContext();

        context.createReference({
            label: 'ref-1',
        } as any as ContextReferenceContentInfo);
        context.createReference({
            label: 'ref-1',
        } as any as ContextReferenceContentInfo);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(2);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data).toMatchSnapshot();
    });

    test('create undefined keys', () => {
        const context = createSimpleContext();

        context.getReferenceLabelIndex('ref-1');
        context.getReferenceLabelIndex('ref-2');

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(2);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data).toMatchSnapshot();
    });

    test('create unused keys', () => {
        const context = createSimpleContext();

        context.createReference({
            label: 'ref-1',
        } as any as ContextReferenceContentInfo);
        context.createReference({
            label: 'ref-2',
        } as any as ContextReferenceContentInfo);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(2);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data).toMatchSnapshot();
    });
});
