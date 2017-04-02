/* globals libjass */

import Ember from 'ember';
export default Ember.Component.extend({
    videoTag:null,
    mediaItem:null,
    subtitles:null,
    subsRenderer:false,
    loading:false,
    currentTime:0,
    startOffset:0,

    didInsertElement(){
        Ember.$.getJSON("/api/subtitles/"+this.get("mediaItem.id"))
            .then(this.subtitlesLoaded.bind(this));
        this.$(window).on("resize", this.onVideoResize.bind(this));
        this.addObserver("currentTime", this.timeChange);
    },

    didDestroyElement(){
        this.$(window).off("resize", this.onVideoResize);
    },

    subtitlesLoaded(o){
        if(o.length) {
            o.push("Disabled");
            this.set("subtitles", o);
        }
    },

    timeChange(){
        if(this.get("clock")) {
            this.get("clock").tick(this.get("startOffset")+this.get("currentTime"));
        }
    },

    showSub(file) {
        libjass.ASS.fromUrl("/api/subtitles/"+this.get("mediaItem.id")+"/"+file)
            .then(function(ass){
                var v = this.get("videoTag");
                if(this.get("subsRenderer")){
                    this.get("subsRenderer").disable();
                    this.get("clock").disable();
                }
                var clock = new libjass.renderers.ManualClock();
                var renderer = new libjass.renderers.WebRenderer(
                    ass,
                    clock,
                    this.$("<div>").insertAfter(v)[0]
                );
                this.set("subsRenderer", renderer);
                this.set("clock", clock);
                clock.setEnabled(true);
                this.onVideoResize();

                this.get("videoTag").play();
            }.bind(this));
    },

    onVideoResize(){
        if(this.get("subsRenderer")) {
            var v = this.get("videoTag");
            var vw = this.$(v).width(), vh = this.$(v).height();
            var ow = v.videoWidth, oh = v.videoHeight;
            if(vw/vh<ow/oh){
                this.get("subsRenderer")
                    .resize(vw, vw*(oh/ow), 0, vh/2-(vw*(oh/ow))/2);
            }else{
                this.get("subsRenderer")
                    .resize(vh*(ow/oh), vh, vw/2-(vh*(ow/oh))/2, 0);
            }
        }
    },

    actions:{
        subClicked(sub){
            if(sub==="Disabled") {
                this.get("subsRenderer").disable();
                return;
            }
            this.showSub(sub);
        }
    }
});
