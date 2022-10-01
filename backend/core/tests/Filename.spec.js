const fs = require('fs');
const filenameSpec = require('../../modules/filename');

describe('Filenames', () => {
  it('parses filenames', () => {
    const items = JSON.parse(fs.readFileSync('backend/core/tests/filenames.json')) || [];
    Object.keys(items).forEach((filepath) => {
      const values = items[filepath];
      values.filepath = filepath;
      const result = { attributes: { filepath } };
      filenameSpec.extendInfo(
        result,
        { type: values.type },
      );
      expect(values).toEqual(result.attributes);
    });
  });
});
