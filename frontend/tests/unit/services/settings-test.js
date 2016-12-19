import { moduleFor, test } from 'ember-qunit';
import wait from 'ember-test-helpers/wait';
import Ember from 'ember';

moduleFor('service:settings', 'Unit | Service | settings', {
  // Specify the other units that are required for this test.
  needs: ['model:setting', 'adapter:application']
});

// Replace this with your real tests.
test('it exists', function(assert) {
  assert.expect(2);
  var service;
  Ember.run(function(){
    service = this.subject();
    assert.ok(service);
  }.bind(this));

  return wait().then(function(){
    assert.ok(service.get("model"));
  });
});
