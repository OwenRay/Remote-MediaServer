import Ember from 'ember';

export default Ember.Route.extend({
    queryParams: {'libraries':'libraries'},
    settings: Ember.inject.service('settings'),

    /*model(params)
    {
        var lib = this.get("settings.model.libraries")[params.offset];
        return {
            info:lib,
            items: this.store.query("media-item", {"libraryId":lib.uuid})
        };
    },*/
    fetch(pageOffset, pageSize, stats)
    {
        var queryParams = {
                page: {offset:pageOffset*pageSize, limit:pageSize},
                sort:this.get("controller.sort"),
                libraryId:this.get("controller.library")
            };
        if(this.get("controller.libraries"))
        {
            queryParams.libraries = this.get("controller.libraries");
        }
        return this.get("store").query('media-item', queryParams)
            .then((data) => {
                stats.totalPages = data.get('meta').totalPages;
                return data.toArray();
            });
    },

    setupController(controller)
    {
        this._super.apply(this, arguments);
        controller.set('fetch', this.fetch.bind(this));
    },

    beforeModel()
    {
        return this.get("settings.loadingPromise");
    },

    actions:{
        play(item)
        {
            this.transitionTo("item.view", item);
        }
    }
});
