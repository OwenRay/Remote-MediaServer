import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('html5-video', 'Integration | Component | html5 video', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  assert.expect(2);


  this.render(hbs`{{html5-video}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#html5-video mediaItem=model}}{{/html5-video}}
  `);

  //assert.equal(this.$().text().trim(), 'template block text');
});
