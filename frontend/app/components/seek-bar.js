import Ember from 'ember';

export default Ember.Component.extend({
    onSeek:null,
    progress:null,
    max:100,

    bufferObj:null,
    progressObj:null,
    trackerObj:null,
    offset:null,
    seekingProgress:-1,

    didInsertElement()
    {
        this.set("bufferObj", this.$(".buffer"));
        this.set("progressObj", this.$(".seekprogress"));
        this.set("trackerObj",  this.$(".seektracker"));
        this.$().mousedown(this.onClick.bind(this));
        this.addObserver("offset", this.onOffsetChange);

        this.addObserver("progress", this.onProgress);
        this.onProgress();
    },

    onOffsetChange()
    {
        //var left = this.get("offset")/this.get("max")*this.trackerObj.width();
        //this.bufferObj.css("left", left+"px");
        //this.progressObj.css("left", left+"px");
    },

    onProgress()
    {
        var progress = this.get("seekingProgress")!==-1?this.get("seekingProgress"):this.get("progress")+this.get("offset");
        this.progressObj.css("width", this.trackerObj.width()*(progress/this.get("max"))+"px");
    },

    onClick(e)
    {
        e.preventDefault();
        e.stopPropagation();
        var func = this.get("onMove").bind(this);
        this.set("onMoveFunc", func);
        Ember.$("body")
            .mousemove(func)
            .mouseup(this.get("stopSeeking").bind(this));
        //this.bufferObj.css("left", "0px");
        //this.progressObj.css("left", "0px");
        this.onMove(e);
    },

    onMove(e)
    {
        var pos = e.pageX-this.trackerObj.offset().left;
        var w = this.trackerObj.width();
        if(pos<0) {
            pos = 0;
        }else if(pos>w)
        {
            pos = w;
        }
        console.log(pos, w, pos/w, this.get("max")*(pos/w));
        this.set("seekingProgress", this.get("max")*(pos/w));
        this.onProgress();
    },

    stopSeeking()
    {
        Ember.$("body")
            .unbind("mousemove", this.get("onMoveFunc"))
            .unbind("mouseup");
        var progress = this.get("seekingProgress");
        this.set("seekingProgress", -1);
        this.onSeek(progress);
        this.onProgress();
        this.onOffsetChange();
    }
});
