import Ember from 'ember';

export default Ember.Component.extend({
    tagName:"video-container",
    //attributeBindings: ['class'],
    //class:"video-container",
    paused:false,
    src:"",
    progress:0,
    videoObj:null,
    mediaItem:null,
    startOffset:0,
    navClass:"hidden",
    volume:80,
    volumeBeforeMute:80,
    mute:false,
    lastPosSave:0,

    videoUrl:Ember.computed("mediaItem", "startOffset", function(){
        if(this.get("startOffset")===-1) {
            return "";
        }
        return "/ply/"+this.get("mediaItem.id")+"/"+this.get("startOffset");
    }),

    didInsertElement()
    {
        var vid = this.$("video");
        this.set("videoObj", vid[0]);
        vid.dblclick(this.toggleFullscreen.bind(this));
        vid.click(this.togglePause.bind(this));
        vid.on("emptied", function(){
        });
        vid.on("abort", function(){
        });
        this.addObserver("volume", this.volumeDidChange);
        this.volumeDidChange();
        Ember.$("body")
            .mousemove(this.onMouseMove.bind(this))
            .keypress(this.onKeyPress.bind(this));
        this.updateProgress();
    },

    muteIcon:Ember.computed("mute", function(){
        return this.get("mute")?"mdi-av-volume-off":"mdi-av-volume-up";
    }),

    volumeDidChange()
    {
        this.get("videoObj").volume = this.get("volume")/100;
    },

    onMouseMove()
    {
        this.set("navClass", "visible");
        clearTimeout(this.get("hideTimeout"));
        this.set("hideTimeout", setTimeout(this.hide.bind(this), 2000));
    },

    hide()
    {
        this.set("navClass", "hidden");
        this.set("navigationVisible", false);
    },

    didDestroyElement()
    {
        clearTimeout(this.get("hideTimeout"));
        Ember.$("body")
            .unbind("mousemove")
            .unbind("keypress");
        this.get("videoObj").src = "";
    },

    togglePause()
    {
        this.set("paused", !this.get("videoObj").paused);
        if(this.get("videoObj").paused)
        {
            return this.get("videoObj").play();
        }
        this.get("videoObj").pause();
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

    onKeyPress(e)
    {
        switch(e.keyCode)
        {
            case 32:
            case 112:
                this.togglePause();
                break;
            case 102:
                this.toggleFullscreen();
                break;

        }
    },

    toggleFullscreen()
    {
        var elem = this.$()[0];
        if (!document.fullscreenElement &&    // alternative standard method
            !document.mozFullScreenElement &&
            !document.webkitFullscreenElement &&
            !document.msFullscreenElement )
        {
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    },

    savePosition()
    {
        var m = this.get("mediaItem");
        m.get("play-position").then(function(lastPos){
            lastPos.set("position", this.get("progress")+this.get("startOffset"));
            lastPos.save();
        }.bind(this));
    },

    actions:{
        togglePauseAction()
        {
            this.togglePause();
        },

        fullscreen()
        {
            this.toggleFullscreen();
        },

        seek(position)
        {
            this.set("startOffset", position);
            this.set("paused", false);
            this.set("progress", 0);
        },

        volumeChange(value)
        {
            this.set("volume", value);
            this.set("mute", false);
        },

        toggleMute()
        {
            this.set("mute", !this.get("mute"));
            if(this.get("mute"))
            {
                this.set("volumeBeforeMute", this.get("volume"));
                this.set("volume", 0);
            }else{
               this.set('volume', this.get("volumeBeforeMute"));
            }
        }
    }
});
