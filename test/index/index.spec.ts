import { convertMarkdownFiles } from '../../src';
import * as fs from 'fs';
import * as path from 'path';

describe('convertMarkdownFiles', function () {
    test('with config', () => {
        convertMarkdownFiles(__dirname);

        expect(
            fs.existsSync(path.join(__dirname, 'out', 'main.tex')),
        ).toBeTruthy();
        expect(
            fs.existsSync(path.join(__dirname, 'out', 'another.tex')),
        ).toBeTruthy();
        expect(
            fs.existsSync(path.join(__dirname, 'out', 'unused.tex')),
        ).not.toBeTruthy();
    });
});
