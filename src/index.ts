import { buildMarkdownAST } from './ast/build';
import { lexer } from './lexer/lexer';
import { applyProcessing } from './processing/process';
import { printMarkdownAST } from './printer/printer';
import * as fs from 'fs';
import * as path from 'path';
import { WriteFileFunction } from './printer/context';
import { readConfig } from './config';

export { buildMarkdownAST, lexer, applyProcessing, printMarkdownAST };

export function convertMarkdownFiles(options: {
    rootDir: string;
    files: string[];
    outDir: string;
}): void {
    const writeFile: WriteFileFunction = function (content, filepath, context) {
        fs.writeFileSync(filepath, content, 'utf8');
    };

    const config = readConfig('md-to-latex-config.yml');

    for (const file of options.files) {
        const filepath = path.join(options.rootDir, file);
        const lexerResult = lexer(fs.readFileSync(filepath, 'utf8'));
        const result = buildMarkdownAST(lexerResult, { filepath: filepath });
        applyProcessing(result);

        printMarkdownAST(result, writeFile, config);
    }
}
