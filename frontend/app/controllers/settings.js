import Ember from 'ember';

export default Ember.Controller.extend({
    settings: Ember.inject.service('settings'),

    actions:{
        save()
        {
            this.get("settings.model").save();
        }
    }
});
