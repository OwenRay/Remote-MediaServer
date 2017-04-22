import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('video-subtitles', 'Integration | Component | video subtitles', {
  integration: true
});

test('it renders', function(assert) {
    assert.expect(0);
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{video-subtitles}}`);

  // Template block usage:
  this.render(hbs`
    {{#video-subtitles}}{{/video-subtitles}}
  `);
});
