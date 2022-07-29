import { convertMarkdownFiles } from '../../src';
import * as fs from 'fs';
import * as path from 'path';

describe('convertMarkdownFiles', function () {
    beforeAll(() => {
        convertMarkdownFiles(__dirname);
    });

    const fileParameters = {
        main: {
            pathTex: path.join(__dirname, 'out', 'main.tex'),
            pathMd: path.join(__dirname, 'files', 'main.tex'),
            emitted: true,
        },
        another: {
            pathTex: path.join(__dirname, 'out', 'another.tex'),
            pathMd: path.join(__dirname, 'files', 'another.tex'),
            emitted: true,
        },
        unused: {
            pathTex: path.join(__dirname, 'out', 'unused.tex'),
            pathMd: path.join(__dirname, 'files', 'unused.tex'),
            emitted: false,
        },
    } as {
        [Key: string]: {
            pathTex: string;
            pathMd: string;
            emitted: boolean;
        };
    };

    Object.entries(fileParameters).forEach(entry => {
        const emitted = entry[1].emitted;
        test(`File ${entry[0]} should${
            emitted ? '' : ' not'
        } be emitted`, () => {
            if (emitted) {
                expect(fs.existsSync(entry[1].pathTex)).toBeTruthy();
            } else {
                expect(fs.existsSync(entry[1].pathTex)).not.toBeTruthy();
            }
        });
    });

    test('main.tex correct content', () => {
        const content = fs.readFileSync(fileParameters.main.pathTex, 'utf8');

        expect(content).toContain('\\subtitle{Main file with content}');
        expect(content).toContain('\\setlength{\\belowcaptionskip}{-4ex}');
        expect(content).not.toContain(
            '\\addtolength{\\belowcaptionskip}{-1em}',
        );
        expect(content).toContain('\\begin{figure}[H]');
        expect(content).toContain('\\includegraphics[height=4cm]{./nothing}');
        expect(content).toContain('\\caption{Рисунок 1 -- Image}');
        expect(content).toContain('\\begin{figure}[H]');
    });

    test('another.tex correct content', () => {
        const content = fs.readFileSync(fileParameters.another.pathTex, 'utf8');

        expect(content).toContain('\\section{Additional file}');
        expect(content).toContain('Formula:');
        expect(content).toContain('\\setlength{\\abovedisplayskip}{-0.9em}');
        expect(content).toContain('\\setlength{\\belowdisplayskip}{0pt}');
        expect(content).toContain('\\setlength{\\abovedisplayshortskip}{0pt}');
        expect(content).toContain('\\setlength{\\belowdisplayshortskip}{0pt}');
    });

    test('another.tex correct link to image, defined in main.mxd', () => {
        const content = fs.readFileSync(fileParameters.another.pathTex, 'utf8');

        expect(content).toContain('Image from main.mxd 1');
    });
});
