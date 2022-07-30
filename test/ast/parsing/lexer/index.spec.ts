import { rawNodeTemplate, snapshotTestTemplate } from './utils';
import fs from 'fs';
import path from 'path';
import { applyVisitors } from '../../../../src/ast/parsing/lexer';

describe('Honorable mention', () => {
    snapshotTestTemplate(
        'Bold with del with code span',
        '**asdas ==`lol==` adas**',
    );

    snapshotTestTemplate(
        'List bug',
        `
Image fragments are grouped together based on similarity,
*simple italic text here*
but unlike standard k-means clustering and such cluster analysis methods.
Code shown in !PK[inline-code].

![gray-square](./assets/img/example.png)(@w 6cm)(@name
    orci varius natoque penatibus et magnis dis parturient montes gray square
)
`,
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
