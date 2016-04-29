import Ember from 'ember';

export default Ember.Controller.extend({
    title:Ember.computed("model.info", "model.items.length", function()
    {
        return this.get("model.info.name")+ "("+this.get("model.items.length")+")";
    })
});
