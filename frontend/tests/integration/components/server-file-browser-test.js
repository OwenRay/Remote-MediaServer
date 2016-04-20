import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('server-file-browser', 'Integration | Component | server file browser', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{server-file-browser}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#server-file-browser}}
      template block text
    {{/server-file-browser}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
