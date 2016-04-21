import Ember from 'ember';

export default Ember.Component.extend({
    tagName:"md-content",
    attributeBindings: ['flex'],
    flex:true,
    
    src:"",
    progress:0,
    videoObj:null,
    mediaItem:null,
    startOffset:0,

    videoUrl:Ember.computed("mediaItem", "startOffset", function(){
        return "/ply/"+this.get("mediaItem.filepath")+"/"+this.get("startOffset");
    }),

    didInsertElement()
    {
        this.set("videoObj", this.$("video")[0]);

        this.updateProgress();
    },

    updateProgress()
    {
        if(this.isDestroyed) {
            return;
        }
        if(this.videoObj.readyState === 4) {
            this.set("progress", this.videoObj.currentTime);
        }
        Ember.run.later(this, "updateProgress", 500);
    },

    actions:{
        seek(position)
        {
            this.set("startOffset", position);
            this.set("progress", 0);
        }
    }
});
