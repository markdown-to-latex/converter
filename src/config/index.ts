import {Validator, ValidatorResult} from 'jsonschema';
import {MarkDownToLaTeXConverter} from './types';
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

export function validateConfig(
    data: MarkDownToLaTeXConverter,
): ValidatorResult {
    const schemaPath = path.resolve(
        __dirname,
        '../../md-to-latex-converter.schema.json',
    );
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const schema = JSON5.parse(schemaContent);

    const validator = new Validator();
    return validator.validate(data, schema, {
        throwError: false,
    });
}

export function readConfig(filepath: string): MarkDownToLaTeXConverter {
    const content = fs.readFileSync(filepath, 'utf8');
    const config = yaml.load(content) as MarkDownToLaTeXConverter;

    const validationResult = validateConfig(config);
    if (validationResult.errors.length > 0) {
        console.log(`Error happen while validating "${filepath}".`);
        throw new ConfigReaderError(
            JSON.stringify(validationResult.errors.map(e => e.toString())),
        );
    }

    return config;
}
