import { CommandInfo, CommandInfoCallback } from '../struct';

interface ArgsType {}

const callback: CommandInfoCallback<ArgsType> = function (ctx, data, args) {
    return [];
};

export default {
    args: [],
    name: 'PL',
    callback: callback,
} as CommandInfo;
