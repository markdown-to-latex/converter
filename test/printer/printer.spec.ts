import { lexer } from '../../src';
import { buildMarkdownAST } from '../../src/ast/build';
import { applyProcessing } from '../../src/processing/process';
import { printMarkdownAST } from '../../src/printer/printer';

function processingChain(text: string): Record<string, string> {
    const lexerResult = lexer(text);
    const result = buildMarkdownAST(lexerResult, { filepath: 'filepath' });
    applyProcessing(result);

    const files: Record<string, string> = {};
    printMarkdownAST(result, (content, fileName) => {
        files[fileName] = content;
    });

    return files;
}

describe('simple md to latex docs printer', () => {
    test('Paragraph', () => {
        const result = processingChain(`
# Header

Text
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toEqual('\\subtitle{Header}\n\nText\n');
    });

    test('Subheader + List + Code Span', () => {
        const result = processingChain(`
# Header

- A
- B
- C

## Subheader

1. X
2. Y
    1. T
        - 600
        - 700
    2. \`Code span\`
3. Z
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toEqual(
            '\\subtitle{Header}\n\n\\hspace{0cm}-\\,A\n\n\\hspace{0cm}-\\,B\n\n\\hspace{0cm}-\\,C\n\n \\section{Subheader}\n\n\\hspace{0cm}а\\,X\n\n\\hspace{0cm}б\\,Y\n\n\\hspace{1.25cm}1\\,T\n\n\\hspace{2.5cm}-\\,600\n\n\\hspace{2.5cm}-\\,700\n\n\\hspace{1.25cm}2\\,\\texttt{Code span}\n\n\\hspace{0cm}в\\,Z\n\n',
        );
    });

    test('Header + Image + Code + Image', () => {
        const result = processingChain(`
# Header

!P[img-1|5cm]
![Image name](./assets/img/dolphin.png)

!C[code-1|Python Sample Code]
\`\`\`python
def main():
    print "Hello World"
\`\`\`

!P[img-2|7cm]
![Image name 2](./assets/img/dolphin.png)
`)['filepath'];
        expect(result).not.toBeUndefined();
        // TODO: check correctly neighbour nodes
        expect(result).toEqual(
            '\\subtitle{Header}\n\n\\setlength{\\intextsep}{3em}  % 3em\n\\setlength{\\belowcaptionskip}{-4ex}\n\n\\setlength{\\abovecaptionskip}{.5em}\n\n\\begin{figure}[H]\n    \\centering\n    \\includegraphics[height=5cm]{./assets/img/dolphin.png}\n    \\captionsetup{justification=centering,indention=0cm,labelformat=empty,margin={0pt,0cm},font={stretch=1.5}}\n    \\caption{Рисунок 1 -- Image name}\n\\end{figure}\n\n\\setlength{\\intextsep}{3em}\n\\setlength{\\belowcaptionskip}{-4ex}\n\n\\setlength{\\abovecaptionskip}{-0.5em}\n\n\\begin{figure}[H]\n    \\fontsize{12}{12}\\selectfont\n    \\begin{minted}\n    [\n    baselinestretch=1.2\n    ]{python}\ndef main():\n    print "Hello World"\n    \\end{minted}\n    \\captionsetup{justification=centering,indention=0cm,labelformat=empty, margin={0pt, 0cm},font={stretch=1.5}}\n    \\caption{Рисунок 2 -- Python Sample Code}\n\\end{figure}\n\n\\setlength{\\intextsep}{3em}  % 3em\n\\setlength{\\belowcaptionskip}{-4ex}\n\n\\setlength{\\abovecaptionskip}{.5em}\n\n\\begin{figure}[H]\n    \\centering\n    \\includegraphics[height=7cm]{./assets/img/dolphin.png}\n    \\captionsetup{justification=centering,indention=0cm,labelformat=empty,margin={0pt,0cm},font={stretch=1.5}}\n    \\caption{Рисунок 3 -- Image name 2}\n\\end{figure}\n\n',
        );
    });

    test('Code + Code', () => {});

    test('Table', () => {});

    test('Header + Formula', () => {});
});
