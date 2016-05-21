import Ember from 'ember';

export default Ember.Component.extend({
    tagName:"video-container",

    src:"",
    progress:0,
    videoObj:null,
    mediaItem:null,
    startOffset:0,
    lastPosSave:0,

    didInsertElement()
    {
        console.log("initvideo");
        this.set("videoObj", this.$("video")[0]);
        this.updateProgress();
    },

    videoUrl:Ember.computed("mediaItem", "startOffset", function(){
        return "/ply/"+this.get("mediaItem.id")+"/"+this.get("startOffset");
    }),

    didDestroyElement()
    {
        this.savePosition();
    },

    updateProgress()
    {
        if(this.isDestroyed) {
            return;
        }
        if(this.videoObj.readyState === 4) {
            this.set("progress", this.videoObj.currentTime);
        }
        if(new Date().getTime()-this.get("lastPosSave")>10000)
        {
            this.set("lastPosSave", new Date().getTime());
            this.savePosition();
        }

        Ember.run.later(this, "updateProgress", 500);
    },

    savePosition()
    {
        console.log("savepos");
        var m = this.get("mediaItem");
        m.get("play-position").then(function(lastPos){
            lastPos.set("position", this.get("progress")+this.get("startOffset"));
            lastPos.save();
            console.log(lastPos);
        }.bind(this));
    },

    actions:{
        seek(position)
        {
            this.set("startOffset", position);
            this.set("progress", 0);
        }
    }
});
