import Ember from 'ember';

export default Ember.Controller.extend({
    actions:{
        play()
        {
            this.transitionToRoute("item.view", this.get("model"));
        }

    }
});
