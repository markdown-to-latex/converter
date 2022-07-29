/** @type SnapshotSerializerPlugin */
module.exports = {
    serialize(val, config, indentation, depth, refs, printer) {
        val = { ...val, filePath: '[PATH]' };

        return printer(val, config, indentation, depth, refs, printer);
    },

    test(val) {
        return (
            val &&
            Object.prototype.hasOwnProperty.call(val, 'filePath') &&
            !(
                val.filePath.indexOf('/') === -1 &&
                val.filePath.indexOf('\\') === -1
            )
        );
    },
};
