import Ember from 'ember';

export default Ember.Controller.extend({
    videoUrl:Ember.computed("model.filepath", function(){
        console.log(this.get("model.filepath"));
        return "/ply/"+this.get("model.filepath");
    })
});
