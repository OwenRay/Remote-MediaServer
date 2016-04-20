import Ember from 'ember';
import DS from "ember-data";

export default Ember.Route.extend({
    settings: Ember.inject.service('settings'),

    model(params)
    {
        return new Promise(function(resolve){

            var doResolve = function()
            {
                resolve(
                    {
                        info:this.get("settings.model.libraries")[params.offset],
                        items:this.store.findAll("media-item")
                    });
            }.bind(this);

            var onChange = function(){
                this.removeObserver("settings.model", onChange);
                doResolve();
            }.bind(this);

            if(this.get("settings.model"))
                doResolve();

            this.addObserver("settings.model", doResolve);
        }.bind(this));
    }
});
