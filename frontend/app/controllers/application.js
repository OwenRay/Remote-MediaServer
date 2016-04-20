import Ember from 'ember';

export default Ember.Controller.extend({
    settings: Ember.inject.service('settings'),

    actions:
    {
        transitionTo(route)
        {
            this.transitionToRoute(route);
        },

        gotoLibrary(library)
        {
            this.transitionToRoute("library", library);
        }
    }
});
