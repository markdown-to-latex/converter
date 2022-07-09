import { tokenize } from '../../../src/ast/parsing/tokenizer';

describe('tokenize', function () {
    test('simple text', () => {
        const TEXT = 'Simple text with words and423 numbers;\n';
        const tokens = tokenize(TEXT);

        expect(tokens).toMatchSnapshot();
    });
    test('Joined Tokens', () => {
        const TEXT = '![message,](simple-text2-#)';
        const tokens = tokenize(TEXT);

        expect(tokens).toMatchSnapshot();
    });
    test('Multiline', () => {
        const TEXT = 'Line 1\nLine 2 [] \n  Line{$$ 3  \nLine4.';
        const tokens = tokenize(TEXT);

        expect(tokens).toMatchSnapshot();
    });
});
