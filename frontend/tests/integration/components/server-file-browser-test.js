import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

moduleForComponent('server-file-browser', 'Integration | Component | server file browser', {
  integration: true
});

test('it renders', function(assert) {
  assert.expect(0);

  Ember.run(function() {
    this.set('showComponent', true);
    this.render(hbs`
      {{#if showComponent}}
        {{#server-file-browser}}{{/server-file-browser}}
      {{/if}}
    `);
  }.bind(this));

});
