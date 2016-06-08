import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('seek-bar', 'Integration | Component | seek bar', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  assert.expect(0);
  // Template block usage:
  this.render(hbs`
    {{#seek-bar}}{{/seek-bar}}
  `);
  //assert.equal(this.$());
});
