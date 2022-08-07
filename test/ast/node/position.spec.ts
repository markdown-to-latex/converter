import {
    copyTextPosition,
    positionToTextPosition,
    splitLinesWithTextPositions,
    TextPosition,
    textPositionEq,
    textPositionG,
} from '../../../src/ast/node';

describe('splitLinesWithTextPositions', () => {
    const STRING = 'Line 1\nLine 2\r\n Line asdas 3 \nLine 4';

    test('With custom base', () => {
        const result = splitLinesWithTextPositions(STRING, 15);
        const original = '123456789012345' + STRING;

        expect(original.slice(result[3].pos, result[3].pos + 5)).toEqual(
            'Line ',
        );

        expect(result).toMatchSnapshot();
    });
});

describe('positionToTextPosition', () => {
    const STRING = 'Line 1\nLine 2\r\n Line asdas 3 \nLine 4';

    test('with zero position', () => {
        const result = positionToTextPosition(STRING, 0);
        const original = '123456789012345' + STRING;

        expect(result.line).toEqual(1);
        expect(result.column).toEqual(1);
    });

    test('with overflow position', () => {
        const result = positionToTextPosition(STRING, STRING.length + 99);

        expect(result.line).toEqual(4);
        expect(result.column).toEqual(7);
    });
});

describe('textPosition comparison', () => {
    test('equality', () => {
        const a: TextPosition = {
            line: 1,
            column: 1,
        };
        const b: TextPosition = copyTextPosition(a);

        expect(textPositionEq(a, b)).toBeTruthy();
    });

    test('inequality', () => {
        const a: TextPosition = {
            line: 1,
            column: 1,
        };
        const b: TextPosition = {
            line: 1,
            column: 3,
        };

        expect(textPositionEq(a, b)).toBeFalsy();
    });

    test('greater', () => {
        const a: TextPosition = {
            line: 2,
            column: 5,
        };
        const b: TextPosition = copyTextPosition(a);
        const c: TextPosition = {
            line: 2,
            column: 6,
        };
        const d: TextPosition = {
            line: 3,
            column: 1,
        };
        const e: TextPosition = {
            line: 99,
            column: 99,
        };
        const f: TextPosition = {
            line: 2,
            column: 4,
        };

        expect(textPositionG(b, a)).toBeFalsy();
        expect(textPositionG(c, a)).toBeTruthy();
        expect(textPositionG(d, a)).toBeTruthy();
        expect(textPositionG(e, a)).toBeTruthy();
        expect(textPositionG(f, a)).toBeFalsy();
    });
});
