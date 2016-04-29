import Ember from 'ember';

export default Ember.Route.extend({
    settings: Ember.inject.service('settings'),

    model(params)
    {
        var lib = this.get("settings.model.libraries")[params.offset];
        return {
            info:lib,
            items: this.store.query("media-item", {"libraryId":lib.uuid})
        };
    },

    beforeModel()
    {
        return this.get("settings.loadingPromise");
    }
});
