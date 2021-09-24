import { buildMarkdownAST } from './ast/build';
import { lexer } from './lexer/lexer';
import { applyProcessing } from './processing/process';
import { printMarkdownAST } from './printer/printer';
import * as fs from 'fs';
import * as path from 'path';
import { WriteFileFunction } from './printer/context';
import { readConfig } from './config';

export { buildMarkdownAST, lexer, applyProcessing, printMarkdownAST };

export function convertMarkdownFiles(rootDir: string): void {
    const writeFile: WriteFileFunction = function (content, filepath, context) {
        fs.writeFileSync(filepath, content, 'utf8');
    };

    const configFileName = path.join(rootDir, 'md-to-latex-converter.yml');
    if (!fs.existsSync(configFileName)) {
        throw new Error(`Config ${configFileName} not found`);
    }

    const config = readConfig(configFileName);

    for (const fileInfo of config.files) {
        const filepath = fileInfo.path;
        const fullFilepath = path.join(rootDir, filepath);

        const lexerResult = lexer(fs.readFileSync(fullFilepath, 'utf8'));
        const result = buildMarkdownAST(lexerResult, {
            filepath: path.join(rootDir, fileInfo.out),
        });

        applyProcessing(result);

        printMarkdownAST(result, writeFile, config.latex);
    }
}
