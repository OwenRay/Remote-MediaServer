import Ember from 'ember';

export default Ember.Controller.extend({
    settings:Ember.inject.service("settings"),
    actions:{
        itemClick(item)
        {
            this.transitionToRoute("item.detail", item);
        }
    }
});
