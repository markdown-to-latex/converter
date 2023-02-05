import { ALL_COMMAND_LIST } from '../../../src/macro/function';

describe('Command no intersection', () => {
    it('no intersection', function () {
        let commandNames = ALL_COMMAND_LIST.map(command => command.name);
        let commandNamesSet = new Set(commandNames);
        expect(commandNames.length).toBe(commandNamesSet.size);
    });
});
