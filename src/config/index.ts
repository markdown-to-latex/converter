import { Validator, ValidatorResult } from 'jsonschema';
import { YAXMBuild } from './types';
import * as path from 'path';
import * as JSON5 from 'json5';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

export class ConfigReaderError extends Error {
    constructor(m: string) {
        super(m);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, ConfigReaderError.prototype);
    }
}

export function validateConfig(data: YAXMBuild): ValidatorResult {
    const schemaPath = path.resolve(__dirname, '../../yaxm-build.schema.json');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const schema = JSON5.parse(schemaContent);

    const validator = new Validator();
    return validator.validate(data, schema, {
        throwError: false,
    });
}

// --- api

export * from './types';
