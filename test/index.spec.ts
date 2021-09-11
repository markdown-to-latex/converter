import {lexer} from "../src";

describe('lexer', () => {
    test('opcode token test', () => {
        const d = lexer('!PK[test|1|2|3]')
        console.log(d)
    })
})