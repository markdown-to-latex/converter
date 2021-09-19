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
        expect(result).toEqual(`\\subtitle{Header}

Text
`);
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
        expect(result).toEqual(`\\subtitle{Header}

\\hspace{0cm}-\\,A

\\hspace{0cm}-\\,B

\\hspace{0cm}-\\,C

\\section{Subheader}

\\hspace{0cm}а)\\,X

\\hspace{0cm}б)\\,Y

\\hspace{1.25cm}1)\\,T

\\hspace{2.5cm}-\\,600

\\hspace{2.5cm}-\\,700

\\hspace{1.25cm}2)\\,\\texttt{Code span}

\\hspace{0cm}в)\\,Z
`);
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
        expect(result).toEqual(`\\subtitle{Header}

\\setlength{\\intextsep}{3em}  % 3em
\\setlength{\\belowcaptionskip}{-4ex}
\\addtolength{\\belowcaptionskip}{-1em}
\\setlength{\\abovecaptionskip}{.5em}

\\begin{figure}[H]
    \\centering
    \\includegraphics[height=5cm]{./assets/img/dolphin.png}
    \\captionsetup{justification=centering,indention=0cm,labelformat=empty,margin={0pt,0cm},font={stretch=1.5}}
    \\caption{Рисунок 1 -- Image name}
\\end{figure}

\\setlength{\\intextsep}{3em}
\\setlength{\\belowcaptionskip}{-4ex}
\\addtolength{\\belowcaptionskip}{-1em}
\\setlength{\\abovecaptionskip}{-0.5em}

\\begin{figure}[H]
    \\fontsize{12}{12}\\selectfont
    \\begin{minted}
    [baselinestretch=1.2]{python}
def main():
    print "Hello World"
    \\end{minted}
    \\captionsetup{justification=centering,indention=0cm,labelformat=empty, margin={0pt, 0cm},font={stretch=1.5}}
    \\caption{Рисунок 2 -- Python Sample Code}
\\end{figure}

\\setlength{\\intextsep}{3em}  % 3em
\\setlength{\\belowcaptionskip}{-4ex}
\\setlength{\\abovecaptionskip}{.5em}

\\begin{figure}[H]
    \\centering
    \\includegraphics[height=7cm]{./assets/img/dolphin.png}
    \\captionsetup{justification=centering,indention=0cm,labelformat=empty,margin={0pt,0cm},font={stretch=1.5}}
    \\caption{Рисунок 3 -- Image name 2}
\\end{figure}
`);
    });

    test('Code + Code', () => {});

    test('Table', () => {});

    test('Header + Formula', () => {});
});
