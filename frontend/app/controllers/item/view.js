import Ember from 'ember';

export default Ember.Controller.extend({
    confirmed:false,
    startOffset:0,

    showDialog:Ember.computed("model.play-position.position", "confirmed", function(){
        if(!this.get("model.play-position.position"))
        {
            this.set("confirmed", true);
        }
        return !this.get("confirmed");
    }),

    actions:{
        startFrom(time)
        {
            this.set("startOffset", time);
            this.set("confirmed", true);
        }
    }
});
