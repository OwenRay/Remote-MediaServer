import Ember from 'ember';

export default Ember.Service.extend({
    store: Ember.inject.service("store"),
    model:null,

    init()
    {
        this.get("store").findRecord("setting", 1).then(function(item)
        {
            this.set("model", item);
        }.bind(this));
    },

    save()
    {
        this.get("model").save();
    }
});
