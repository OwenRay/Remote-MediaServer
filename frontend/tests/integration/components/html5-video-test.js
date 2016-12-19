import { moduleForComponent, test } from 'ember-qunit';
import wait from 'ember-test-helpers/wait';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

moduleForComponent('html5-video', 'Integration | Component | html5 video', {
  integration: true
});

test('it renders', function(assert) {
  assert.expect(0);

  Ember.run(function() {
    var store = this.container.lookup("service:store");
    var m = store.createRecord("media-item");
    m.set("play-position", store.createRecord("play-position"));
    this.set("model", m);
    this.set('showComponent', true);
    this.render(hbs`
      {{#if showComponent}}
        {{#html5-video mediaItem=model}}{{/html5-video}}
      {{/if}}
    `);
    this.set('showComponent', false);

  }.bind(this));
  return wait();
});
