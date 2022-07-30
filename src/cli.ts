import { convertMarkdownFiles } from './index';
import * as path from 'path';
import { DiagnoseList, printDiagnosticList } from './diagnose';

export function getVersion(): string {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { version } = require('../package.json');
    return version;
}

const HELP_MESSAGE =
    `md-to-latex version: ${getVersion()}\n` +
    '\x1b[0m\n' +
    'Usage: \x1b[35mmd-to-latex \x1b[34m\x1b[1m[--help]\x1b[0m' +
    '\x1b[0m\n';

const ERROR_MESSAGE =
    'Unexpected argument. Use command below to get information:\n' +
    '\x1b[34mmd-to-latex --help\x1b[0m\n';

export function executeCli(args: string[]): void {
    if (args.length > 1) {
        console.log(ERROR_MESSAGE);
        process.exit(1);
    }

    if (args[0] === '--help') {
        console.log(HELP_MESSAGE);
        process.exit(1);
    }

    const diagnostic = convertMarkdownFiles(path.resolve('.'));
    printDiagnosticList(diagnostic);

    if (diagnostic.length) {
        process.exit(1);
    }
}

executeCli(process.argv.slice(2));
