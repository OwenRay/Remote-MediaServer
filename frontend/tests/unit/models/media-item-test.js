import { moduleForModel, test } from 'ember-qunit';

moduleForModel('media-item', 'Unit | Model | media item', {
  // Specify the other units that are required for this test.
  needs: ["model:play-position"]
});

test('it exists', function(assert) {
  let model = this.subject();
  // let store = this.store();
  assert.ok(!!model);
});
