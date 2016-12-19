import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('changing-background', 'Integration | Component | changing background', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  // Template block usage:
  this.render(hbs`
    {{#changing-background}}
      template block text
    {{/changing-background}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
