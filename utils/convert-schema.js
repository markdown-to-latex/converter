// eslint-disable-next-line @typescript-eslint/no-var-requires
const schemaConverter = require('json-schema-to-typescript');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

// compile from file
schemaConverter
    .compileFromFile('md-to-latex-converter.schema.json')
    .then(ts => fs.writeFileSync('src/printer/types.ts', ts));
