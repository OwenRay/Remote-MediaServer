const fs = require('fs');
const filename = require('../../modules/filename');

module.exports = {
  testFilenameParsing(test) {
    const items = JSON.parse(fs.readFileSync('backend/core/tests/filenames.json')) || [];
    Object.keys(items).forEach((filepath) => {
      const values = items[filepath];
      values.filepath = filepath;
      const result = { attributes: { filepath } };
      filename.extendInfo(
        result,
        { type: values.type },
      );
      test.deepEqual(values, result.attributes);
    });
    test.done();
  },

};
