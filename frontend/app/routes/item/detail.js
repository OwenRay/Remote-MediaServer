import Ember from 'ember';

export default Ember.Route.extend({
    model(params)
    {
        console.log("a");
        return this.store.findRecord("media-item", params.id);
    }
});
