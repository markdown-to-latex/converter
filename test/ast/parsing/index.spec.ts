import { fullContentPos } from '../../../src/ast/parsing';
import {
    createStartEndTextPos,
    StartEndTextPosition,
} from '../../../src/ast/node';
import { equal } from 'assert';

describe('fullContentPos check', () => {
    test('Empty string', () => {
        const result = fullContentPos('');
        const expected: StartEndTextPosition = createStartEndTextPos(
            1,
            1,
            1,
            1,
        );

        expect(result).toEqual(expected);
    });

    test('One line', () => {
        const result = fullContentPos('123456789');
        const expected: StartEndTextPosition = createStartEndTextPos(
            1,
            1,
            1,
            10,
        );

        expect(result).toEqual(expected);
    });

    test('Multiple lines', () => {
        const result = fullContentPos('123456789\n\n\n123456789\n12345');
        const expected: StartEndTextPosition = createStartEndTextPos(
            1,
            1,
            5,
            6,
        );

        expect(result).toEqual(expected);
    });

    test('Multiple lines, the last is empty', () => {
        const result = fullContentPos('12\n\n\n679\n145\n\n');
        const expected: StartEndTextPosition = createStartEndTextPos(
            1,
            1,
            7,
            1,
        );

        expect(result).toEqual(expected);
    });
});
