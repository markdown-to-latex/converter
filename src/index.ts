import * as fs from 'fs';
import * as path from 'path';
import { readConfig } from './config';
import { FileNode, NodeType, RawNode, RawNodeType } from './ast/node';
import { DiagnoseList } from './diagnose';
import { parseFile } from './ast/parsing';
import { applyMacros } from './macro';
import { buildConfig, createLatexPrinter } from './printer/latex';

// TODO: deprecate
export function fileToNode(content: string, filepath: string): RawNode {
    const fileNode: FileNode = {
        type: NodeType.File,
        parent: null,
        pos: {
            start: 0,
            end: content.length,
        },
        raw: content,
        path: filepath,
        children: [],
    };

    const rawNode: RawNode = {
        type: RawNodeType.Raw,
        parent: fileNode,
        pos: {
            start: 0,
            end: content.length,
        },
        text: content,
    };
    fileNode.children.push(rawNode);

    return rawNode;
}

export function convertMarkdownFiles(rootDir: string): DiagnoseList {
    const configFileName = path.join(rootDir, 'md-to-latex-converter.yml');
    if (!fs.existsSync(configFileName)) {
        throw new Error(`Config ${configFileName} not found`);
    }

    const config = readConfig(configFileName);
    const printerConfig = buildConfig({
        ...config.latex,
    });

    const diagnostic: DiagnoseList = [];

    for (const fileInfo of config.files) {
        const filepath = fileInfo.path;
        const fullFilepath = path.join(rootDir, filepath);

        const outDir = path.join(rootDir, path.dirname(fileInfo.out));
        fs.mkdirSync(outDir, { recursive: true });

        const content = fs.readFileSync(fullFilepath, 'utf8');

        const fileResult = parseFile(content, fullFilepath);
        const fileNode = fileResult.result;
        diagnostic.push(...fileResult.diagnostic);

        const macrosDiagnostic = applyMacros(fileNode);
        diagnostic.push(...macrosDiagnostic);

        const printer = createLatexPrinter(printerConfig);
        const printerResult = printer.processNode(printer, fileNode);
        diagnostic.push(...printerResult.diagnostic);

        fs.writeFileSync(
            path.join(rootDir, fileInfo.out),
            printerResult.result,
            'utf8',
        );
    }

    return diagnostic;
}
