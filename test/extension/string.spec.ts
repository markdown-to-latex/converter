import { StringE } from '../../src/extension/string';

describe('StringE getLinesWithThextPositions', () => {
    const STRING = StringE.from('Line 1\nLine 2\r\n Line asdas 3 \nLine 4');

    test('With custom base', () => {
        const result = STRING.getLinesWithTextPositions(15);
        const original = '123456789012345' + STRING.s

        expect(original.slice(result[3].pos, result[3].pos + 5)).toEqual('Line ');

        expect(result).toMatchSnapshot();
    });
});
