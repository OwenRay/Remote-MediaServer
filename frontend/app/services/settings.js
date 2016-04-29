import Ember from 'ember';

export default Ember.Service.extend({
    store: Ember.inject.service("store"),
    model:null,
    loadingPromise:null,

    init()
    {
        console.log("initSettings");
        var promise = new Ember.RSVP.Promise(function(resolve) {
            var s = this.get("store").findRecord("setting", 1);
            this.set("model", s);
            s.then(function (item) {
                resolve();
                this.set("model", item);
            }.bind(this));
        }.bind(this));

        this.set("loadingPromise", promise);
    },

    save()
    {
        this.get("model").save();
    }
});
