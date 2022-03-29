import {
    applyProcessing,
    buildMarkdownAST,
    initContext,
    lexer,
    printMarkdownAST,
} from '../../src';
import { OpCodeError } from '../../src/printer/opcodes';
import { ContextError } from '../../src/printer/context';
import { MarkDownToLaTeXConverter } from '../../src/printer/types';

function processingChain(
    text: string,
    config?: Partial<MarkDownToLaTeXConverter>,
): Record<string, string> {
    const lexerResult = lexer(text);
    const result = buildMarkdownAST(lexerResult, { filepath: 'filepath' })

    const files: Record<string, string> = {};
    const context = initContext((content, fileName) => {
        files[fileName] = content;
    }, config);

    applyProcessing(result, context);

    printMarkdownAST(result, context);

    return files;
}

describe('simple md to latex docs printer', () => {
    test('Paragraph', () => {
        const result = processingChain(`
# Header

Text
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
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
    2. \`Code_span\`
3. Z
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });

    test('Header + Image + Code + Image', () => {
        const result = processingChain(`
# Header

!P[img-1!5cm]
![Image name](./assets/img/dolphin.png)

!C[code-1!Python Sample Code]
\`\`\`python
def main():
    print "Hello World"
\`\`\`

!P[img-2!7cm]
![Image name 2](./assets/img/dolphin.png)
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });

    test('Code + Code', () => {
        const result = processingChain(`
# Header

Code in !PK[code-1] и !PK[code-2].

!C[code-1!Python Sample Code]
\`\`\`python
def main():
    print "Hello World"
\`\`\`

!C[code-2!Python Sample Code 2]
\`\`\`python
def hello_world():
    print "Hello World"
\`\`\`
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });

    test('Table', () => {
        const result = processingChain(`
Demonstrated in table  

!T[table!Table with content]

|a|b|c|d|
|---|---|---|---|
|1|2|3|4|
|t|r|e|z|
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });

    test('Header + Formula', () => {
        const result = processingChain(`
# Header

\`\`\`math
    a = b + c
\`\`\`
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });

    test('bold and italic', () => {
        const result = processingChain(`**Bold**: *testing*`)['filepath'];

        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });
});

describe('Applications', () => {
    test('with list', () => {
        const result = processingChain(`
!AC[code-full!./assets/code!template-full.py!python]
!AC[code-full2!./assets/code!template-full2.py!python]
!APR[picture-large!Large scheme!./assets/img/circuit.png]
        
# Header

Code from application !AK[code-full2] describes image from application !AK[picture-large].

See application !AK[code-full].

# Applications

!LAA[]
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });

    test('with multiple columns', () => {
        const result = processingChain(`
!ACC[2]
!AC[code-full!./assets/code!template-full.py!python]
        
# Header

See application !AK[code-full].

# Applications

!LAA[]
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });

    test('Unused application, should throw error', () => {
        const result = () =>
            processingChain(`
!AC[code-full!./assets/code!template-full.py!python]

!LAA[]
`)['filepath'];
        expect(result).toThrow(OpCodeError);
    });

    test('Undefined application, should throw error', () => {
        const result = () =>
            processingChain(`
!AK[nope]
`)['filepath'];
        expect(result).toThrow(ContextError);
    });
});

describe('References', () => {
    test('with list', () => {
        const result = processingChain(`
!RR[ref-1]
\`\`\`ref
H.\\,Y.\\~Ignat. "Reference\\~1" // Some Journal, 1867
\`\`\`

!RR[ref-2]
\`\`\`ref
H.\\,Y.\\~Ignat. "Reference\\~2" // Some Journal, 1867
\`\`\`
        
# Header

Code from reference !RK[ref-2] describes image from reference !RK[ref-1].

# References

!LAR[]
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });

    test('Unused reference, should throw error', () => {
        const result = () =>
            processingChain(`
!RR[ref]
\`\`\`ref
A.\\,A.\\~Amogus. "Impostor\\~theorem" // Steam library, 2021
\`\`\`

!LAR[]
`)['filepath'];
        expect(result).toThrow(OpCodeError);
    });

    test('Undefined reference, should throw error', () => {
        const result = () =>
            processingChain(`
!RK[nope]
`)['filepath'];
        expect(result).toThrow(ContextError);
    });

    test('Inline math', () => {
        const result = processingChain(`
Text $\`a = b + \\sum_{i=0}^\\infty c_i\`$ ending.
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result)
            .toEqual(`Text $\\displaystyle a = b + \\sum_{i=0}^\\infty c_i$ ending.
`);
    });

    test('Text with percents', () => {
        const result = processingChain(`
Text with 10% number.
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });

    test('Text with escapes ("<" sound be corrent also)', () => {
        const result = processingChain(`
Text with \\<assdasd.
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });

    test('Tag <hr> should break the page', () => {
        const result = processingChain(`
The first page

---------------------------------------

The second page
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });

    test('Tag <br> should put additional break', () => {
        const result = processingChain(`
The first line  
The second line
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });

    test("Text ' dereplacement", () => {
        const result = processingChain(`
Otsu's method is a one-dimensional discrete analog of Fisher's 
Discriminant Analysis, is related to Jenks optimization method.
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result)
            .toEqual(`Otsu's method is a one-dimensional discrete analog of Fisher's 
Discriminant Analysis, is related to Jenks optimization method.
`);
    });

    test('Inline latex math dereplacement', () => {
        const result = processingChain(`
$\`a > b < c\`$
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });

    test('Table and picture key', () => {
        const result = processingChain(`
Displayed in picture !PK[gray-square] (!PK[gray-square]) and table !TK[table].

!P[gray-square!5cm]
![Gray square](./assets/img/example.png)

!T[table!Table]
        
|Key    |Value |
|-------|------|
|Static number | 50 |
|Random number | $$ \\showcaserandomnumber $$ |
`)['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });
});

describe('latex picture after table (#52)', function () {
    // See https://github.com/markdown-to-latex/converter/issues/52
    test('Picture right after the table', () => {
        const result = processingChain(
            `!T[table!Table example]

| Key           | Value                       |
| ------------- | --------------------------- |
| Static number | 50                          |

!P[gray-square!5cm]
![Gray square](./assets/img/example.png)`,
        )['filepath'];

        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });

    test('Table + text + picture', () => {
        const result = processingChain(
            `!T[table!Table example]

| Key           | Value                       |
| ------------- | --------------------------- |
| Static number | 50                          |

Sample text line

!P[gray-square!5cm]
![Gray square](./assets/img/example.png)`,
        )['filepath'];

        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });
});

describe('url variants', () => {
    test('Default url', () => {
        const result = processingChain(
            'https://example.com/index_page.html?asd=asdasd&gege=gegege#header',
        )['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });

    test('Bold url', () => {
        const result = processingChain(
            'https://example.com/index_page.html?asd=asdasd&gege=gegege#header',
            {
                latex: {
                    useLinkAs: 'bold',
                },
            },
        )['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });

    test('Italic url', () => {
        const result = processingChain(
            'https://example.com/index_page.html?asd=asdasd&gege=gegege#header',
            {
                latex: {
                    useLinkAs: 'italic',
                },
            },
        )['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });

    test('Underlined url', () => {
        const result = processingChain(
            'https://example.com/index_page.html?asd=asdasd&gege=gegege#header',
            {
                latex: {
                    useLinkAs: 'underline',
                },
            },
        )['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });

    test('No escape & code url', () => {
        const result = processingChain(
            'https://example.com/index_page.html?asd=asdasd&asdasd=gege#header',
            {
                latex: {
                    useLinkAs: 'code',
                    defaultAutoEscapes: false,
                },
            },
        )['filepath'];
        expect(result).not.toBeUndefined();
        expect(result).toMatchSnapshot();
    });
});
