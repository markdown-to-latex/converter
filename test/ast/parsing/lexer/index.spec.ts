import { rawNodeTemplate, snapshotTestTemplate } from './utils';
import fs from 'fs';
import path from 'path';
import { applyVisitors } from '../../../../src/ast/parsing/lexer';

describe('Honorable mention', () => {
    snapshotTestTemplate(
        'Bold with del with code span',
        '**asdas ==`lol==` adas**',
    );
});

test('Complex File', () => {
    const content = fs.readFileSync(
        path.join(__dirname, '__files__', 'Default.mxd'),
        'utf8',
    );
    const rawNode = rawNodeTemplate(content);

    const { nodes, diagnostic } = applyVisitors([rawNode]);
    expect(diagnostic).toHaveLength(0);
    expect(nodes).toMatchSnapshot();
});
