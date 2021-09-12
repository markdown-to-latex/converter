import * as marked from 'marked';

export { lexer } from './lexer/lexer';

console.log();

marked.use({
    tokenizer: {},
    renderer: {},
});
