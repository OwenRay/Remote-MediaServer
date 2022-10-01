const fs = require('fs');
const util = require('util');
const DatabaseSpec = require('../database/Database');

const mkdir = util.promisify(fs.mkdir);

describe('Database', () => {
  beforeEach(() => mkdir('store').catch(console.log));
  afterEach(() => {
    ['store/ids', 'store/table', 'store/version', 'store/media-item']
      .forEach((f) => {
        try {
          fs.unlinkSync(f);
          // eslint-disable-next-line no-empty
        } catch (e) { }
      });
    fs.rmdirSync('store');
  });

  it('inserts', async () => {
    const o = DatabaseSpec.setObject('table', { test: 'test' });
    expect(o.id).toEqual(1);
    expect(DatabaseSpec.getById('table', o.id)).not.toEqual(null);
  });

  it('finds', () => {
    for (let c = 0; c < 10; c += 1) {
      DatabaseSpec.setObject('table', { test: `${c}` });
    }
    expect(DatabaseSpec.findBy('table', 'test', 5)).toBeTruthy();
    expect(DatabaseSpec.findByMatchFilters('table', { test: '5' })).toHaveLength(1);
  });

  it('writes', async () => {
    DatabaseSpec.setObject('media-item', { test: 'test' });
    let resolve;
    const promise = new Promise((r) => { resolve = r; });
    DatabaseSpec.doSave('media-item', resolve);

    await promise;
    expect(fs.statSync('store/media-item')).toBeTruthy();
  });
});
