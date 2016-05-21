import Ember from 'ember';

export default Ember.Route.extend({
    settings: Ember.inject.service('settings'),
        
    beforeModel()
    {
        return this.get("settings.loadingPromise");
    }
});
