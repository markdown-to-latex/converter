import { StringE } from '../../src/extension/string';

describe('StringE slicePosition', () => {
    const largeText = StringE.from(`Line 1 with test asd fgh jkl
Line 2 with test asd fgh jkl
Line 3 with test asd fgh jkl
Line 4 with test asd fgh jkl
Line 5 with test asd fgh jkl
Line 6 with test asd fgh jkl
Line 7 with test asd fgh jkl
Line 8 with test asd fgh jkl
Line 9 with test asd fgh jkl
Line A with test asd fgh jkl
Line B with test asd fgh jkl
Line C with test asd fgh jkl`);

    test('empty', () => {
        const result = largeText.slicePosition(
            { line: 1, column: 1 },
            { line: 1, column: 1 },
            { line: 1, column: 1 },
        ).s;

        expect(result).toEqual('');
    });

    test('empty, custom base', () => {
        const result = largeText.slicePosition(
            { line: 10, column: 1 },
            { line: 11, column: 1 },
            { line: 11, column: 1 },
        ).s;

        expect(result).toEqual('');
    });

    test('text, custom base', () => {
        const result = largeText.slicePosition(
            { line: 10, column: 1 },
            { line: 11, column: 1 },
            { line: 12, column: 5 },
        ).s;

        expect(result).toEqual('Line 2 with test asd fgh jkl\nLine');
    });

    test('text, single line, custom base', () => {
        const result = largeText.slicePosition(
            { line: 10, column: 1 },
            { line: 12, column: 1 },
            { line: 12, column: 5 },
        ).s;

        expect(result).toEqual('Line');
    });
});
