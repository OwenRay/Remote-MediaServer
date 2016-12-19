import Ember from 'ember';

export default Ember.Route.extend({
    model(params)
    {
        return this.store.findRecord("media-item", params.id);
    },

    resetController(controller)
    {
        controller.set("confirmed", false);
        controller.set("startOffset", 0);
    },

    afterModel(model)
    {
        return new Ember.RSVP.Promise(function(resolve, reject) {
            if(!model.get("play-position.id"))
            {
                console.log("creating record");
                var pos = this.store.createRecord("play-position");
                pos.save().then(function () {
                        model.save();
                        resolve();
                    }, reject);
                model.set("play-position", pos);
                return;
            }
            model.get("play-position").then(resolve, reject);
        }.bind(this));
    }
});
