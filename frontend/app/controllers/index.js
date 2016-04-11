import Ember from 'ember';

export default Ember.Controller.extend({
    actions:{
        itemClick(item)
        {
            this.transitionToRoute("item.view", item)
        }
    }
});
