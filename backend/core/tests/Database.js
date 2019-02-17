const fs = require('fs');
const util = require('util');
const Database = require('../database/Database');

const mkdir = util.promisify(fs.mkdir);

module.exports = {
  async setUp(cb) {
    await mkdir('store');
    cb();
  },

  testInsert(test) {
    test.expect(2);
    const o = Database.setObject('table', { test: 'test' });
    test.strictEqual(o.id, 1, 'Can not insert database object');
    test.notStrictEqual(Database.getById('table', o.id), null, 'Object was inserted, but not found');
    test.done();
  },
  testFind(test) {
    test.expect(2);
    for (let c = 0; c < 10; c += 1) {
      Database.setObject('table', { test: `${c}` });
    }
    test.ok(Database.findBy('table', 'test', 5));
    test.strictEqual(1, Database.findByMatchFilters('table', { test: '5' }).length);
    test.done();
  },
  testWrite(test) {
    test.expect(1);
    Database.doSave('media-item', () => {
      test.ok(fs.statSync('store/media-item'));
      test.done();
    });
  },

  tearDown(callback) {
    ['store/ids', 'store/table', 'store/version', 'store/media-item']
      .forEach((f) => {
        try {
          fs.unlinkSync(f);
          // eslint-disable-next-line no-empty
        } catch (e) { }
      });
    fs.rmdirSync('store');
    callback();
  },
};
