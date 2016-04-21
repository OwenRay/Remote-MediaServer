import Ember from 'ember';

export default Ember.Route.extend({
    settings: Ember.inject.service('settings'),

    model(params)
    {
        return new Ember.RSVP.Promise(function(resolve){

            var doResolve = function()
            {
                var lib = this.get("settings.model.libraries")[params.offset];
                resolve(
                    {
                        info:lib,
                        items:this.store.query("media-item", {"libraryId":lib.uuid})
                    });
            }.bind(this);

            var onChange = function(){
                this.removeObserver("settings.model", onChange);
                doResolve();
            }.bind(this);

            if(this.get("settings.model")) {
                doResolve();
            }

            this.addObserver("settings.model", doResolve);
        }.bind(this));
    }
});
