import Ember from 'ember';

export default Ember.Component.extend({
    onSeek:null,
    progress:null,
    max:100,

    bufferObj:null,
    progressObj:null,
    trackerObj:null,
    offset:null,
    seekingProgress:0,

    didInsertElement()
    {
        this.set("bufferObj", this.$(".buffer"));
        this.set("progressObj", this.$(".progress"));
        this.set("trackerObj",  this.$(".tracker"));
        this.$().mousedown(this.onClick.bind(this));
        this.addObserver("offset", this.onOffsetChange);

        this.addObserver("progress", this.onProgress);
    },

    onOffsetChange()
    {
        var left = this.get("offset")/this.get("max")*this.trackerObj.width();
        this.bufferObj.css("left", left+"px");
        this.progressObj.css("left", left+"px");
    },

    onProgress()
    {
        var progress = this.get("seekingProgress")?this.get("seekingProgress"):this.get("progress");
        this.progressObj.css("width", this.trackerObj.width()*(progress/this.get("max"))+"px");
    },

    onClick(e)
    {
        e.preventDefault();
        e.stopPropagation();
        Ember.$("body")
            .mousemove(this.get("onMove").bind(this))
            .mouseup(this.get("stopSeeking").bind(this));
        this.bufferObj.css("left", "0px");
        this.progressObj.css("left", "0px");
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
        this.set("seekingProgress", this.get("max")*(pos/w));
        this.onProgress();
    },

    stopSeeking()
    {
        Ember.$("body")
            .unbind("mousemove")
            .unbind("mouseup");
        var progress = this.get("seekingProgress");
        this.set("seekingProgress", 0);
        this.onSeek(progress);
        this.onProgress();
        this.onOffsetChange();
    }
});
