import Ember from 'ember';

export default Ember.Controller.extend({
    store: Ember.inject.service('store'),

    /*fetch(pageOffset, pageSize, stats)
    {
        console.log(arguments, this);
        return this.get("store").query('media-item', {page: pageOffset}).then((data) => {
            console.log(data.get("meta"));
            stats.totalPages = data.get('meta').totalPages;
            return data.toArray();
        });
    },*/

    title:Ember.computed("model.info", "model.items.length", function()
    {
        return this.get("model.info.name")+ "("+this.get("model.items.length")+")";
    })
});
