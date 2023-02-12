import {
    ContextApplicationContentInfo,
    contextDataGenericEmpty,
    ContextE,
    ContextPictureInfo,
    ContextReferenceContentInfo,
    ContextTableInfo,
} from '../../../src/macro/context';
import { Node, NodeType, TextNode } from '../../../src/ast/node';

function createSimpleTextNode(text: string): TextNode {
    return {
        type: NodeType.Text,
        parent: null,
        pos: {
            start: 0,
            end: text.length,
        },
        text,
    };
}

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
            application: contextDataGenericEmpty(),
            reference: contextDataGenericEmpty(),
            picture: contextDataGenericEmpty(),
            table: contextDataGenericEmpty(),
            formula: contextDataGenericEmpty(),
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
            label: createSimpleTextNode('pic-3'),
        } as any as ContextPictureInfo);
        context.getOrCreatePictureLabelIndex(createSimpleTextNode('pic-1'));
        context.getOrCreatePictureLabelIndex(createSimpleTextNode('pic-2'));
        context.getOrCreatePictureLabelIndex(createSimpleTextNode('pic-3'));
        context.createPictureLabelData({
            label: createSimpleTextNode('pic-2'),
        } as any as ContextPictureInfo);
        context.createPictureLabelData({
            label: createSimpleTextNode('pic-1'),
        } as any as ContextPictureInfo);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(0);
        expect(context.c.data.picture).toMatchSnapshot();
    });

    test('create same key twice', () => {
        const context = createSimpleContext();

        context.createPictureLabelData({
            label: createSimpleTextNode('pic-1'),
        } as any as ContextPictureInfo);
        context.createPictureLabelData({
            label: createSimpleTextNode('pic-1'),
        } as any as ContextPictureInfo);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(1);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data.picture).toMatchSnapshot();
    });

    test('create undefined keys', () => {
        const context = createSimpleContext();

        context.getOrCreatePictureLabelIndex(createSimpleTextNode('pic-1'));
        context.getOrCreatePictureLabelIndex(createSimpleTextNode('pic-3'));

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(2);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data.picture).toMatchSnapshot();
    });

    test('create unused keys', () => {
        const context = createSimpleContext();

        context.createPictureLabelData({
            label: createSimpleTextNode('pic-1'),
        } as any as ContextPictureInfo);
        context.createPictureLabelData({
            label: createSimpleTextNode('pic-2'),
        } as any as ContextPictureInfo);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(2);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data.picture).toMatchSnapshot();
    });
});

describe('context tables', () => {
    test('simple', () => {
        const context = createSimpleContext();

        context.createTableLabelData({
            label: createSimpleTextNode('table-3'),
        } as any as ContextTableInfo);
        context.getOrCreateTableLabelIndex(createSimpleTextNode('table-1'));
        context.getOrCreateTableLabelIndex(createSimpleTextNode('table-2'));
        context.getOrCreateTableLabelIndex(createSimpleTextNode('table-3'));
        context.createTableLabelData({
            label: createSimpleTextNode('table-2'),
        } as any as ContextTableInfo);
        context.createTableLabelData({
            label: createSimpleTextNode('table-1'),
        } as any as ContextTableInfo);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(0);
        expect(context.c.data.table).toMatchSnapshot();
    });

    test('create same key twice', () => {
        const context = createSimpleContext();

        context.createTableLabelData({
            label: createSimpleTextNode('table-1'),
        } as any as ContextTableInfo);
        context.createTableLabelData({
            label: createSimpleTextNode('table-1'),
        } as any as ContextTableInfo);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(1);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data.table).toMatchSnapshot();
    });

    test('create undefined keys', () => {
        const context = createSimpleContext();

        context.getOrCreateTableLabelIndex(createSimpleTextNode('table-1'));
        context.getOrCreateTableLabelIndex(createSimpleTextNode('table-3'));

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(2);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data.table).toMatchSnapshot();
    });

    test('create unused keys', () => {
        const context = createSimpleContext();

        context.createTableLabelData({
            label: createSimpleTextNode('table-1'),
        } as any as ContextTableInfo);
        context.createTableLabelData({
            label: createSimpleTextNode('table-2'),
        } as any as ContextTableInfo);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(2);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data.table).toMatchSnapshot();
    });
});

describe('context application', () => {
    test('simple', () => {
        const context = createSimpleContext();

        context.createApplication({
            label: createSimpleTextNode('app-1'),
        } as any as ContextApplicationContentInfo);
        context.createApplication({
            label: createSimpleTextNode('app-2'),
        } as any as ContextApplicationContentInfo);
        expect(
            context.getApplicationLabelIndex(createSimpleTextNode('app-2')),
        ).toEqual(0);
        expect(
            context.getApplicationLabelIndex(createSimpleTextNode('app-1')),
        ).toEqual(1);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(0);
        expect(context.c.data.application).toMatchSnapshot();
    });

    test('create same key twice', () => {
        const context = createSimpleContext();

        context.createApplication({
            label: createSimpleTextNode('app-1'),
        } as any as ContextApplicationContentInfo);
        context.createApplication({
            label: createSimpleTextNode('app-1'),
        } as any as ContextApplicationContentInfo);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(2);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data.application).toMatchSnapshot();
    });

    test('create undefined keys', () => {
        const context = createSimpleContext();

        context.getApplicationLabelIndex(createSimpleTextNode('app-1'));
        context.getApplicationLabelIndex(createSimpleTextNode('app-2'));

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(2);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data.application).toMatchSnapshot();
    });

    test('create unused keys', () => {
        const context = createSimpleContext();

        context.createApplication({
            label: createSimpleTextNode('app-1'),
        } as any as ContextApplicationContentInfo);
        context.createApplication({
            label: createSimpleTextNode('app-2'),
        } as any as ContextApplicationContentInfo);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(2);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data.application).toMatchSnapshot();
    });
});

describe('context reference', () => {
    test('simple', () => {
        const context = createSimpleContext();

        context.createReference({
            label: createSimpleTextNode('ref-1'),
        } as any as ContextReferenceContentInfo);
        context.createReference({
            label: createSimpleTextNode('ref-2'),
        } as any as ContextReferenceContentInfo);
        expect(
            context.getReferenceLabelIndex(createSimpleTextNode('ref-2')),
        ).toEqual(0);
        expect(
            context.getReferenceLabelIndex(createSimpleTextNode('ref-1')),
        ).toEqual(1);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(0);
        expect(context.c.data.reference).toMatchSnapshot();
    });

    test('create same key twice', () => {
        const context = createSimpleContext();

        context.createReference({
            label: createSimpleTextNode('ref-1'),
        } as any as ContextReferenceContentInfo);
        context.createReference({
            label: createSimpleTextNode('ref-1'),
        } as any as ContextReferenceContentInfo);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(2);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data.reference).toMatchSnapshot();
    });

    test('create undefined keys', () => {
        const context = createSimpleContext();

        context.getReferenceLabelIndex(createSimpleTextNode('ref-1'));
        context.getReferenceLabelIndex(createSimpleTextNode('ref-2'));

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(2);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data.reference).toMatchSnapshot();
    });

    test('create unused keys', () => {
        const context = createSimpleContext();

        context.createReference({
            label: createSimpleTextNode('ref-1'),
        } as any as ContextReferenceContentInfo);
        context.createReference({
            label: createSimpleTextNode('ref-2'),
        } as any as ContextReferenceContentInfo);

        context.diagnoseAll();

        expect(context.c.diagnostic).toHaveLength(2);
        expect(context.c.diagnostic).toMatchSnapshot();
        expect(context.c.data.reference).toMatchSnapshot();
    });
});
