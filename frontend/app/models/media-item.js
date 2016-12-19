import DS from 'ember-data';
import Ember from 'ember';

export default DS.Model.extend({
    title:DS.attr("string"),
    year:DS.attr("string"),
    filepath:DS.attr("string"),
    "poster-path":DS.attr("string"),
    "backdrop-path":DS.attr("string"),
    overview:DS.attr("string"),
    "vote-average":DS.attr("number"),
    "fileduration":DS.attr("number"),
    "play-position":DS.belongsTo("play-position"),
    "external-id":DS.attr("number"),
    "season":DS.attr("number"),
    "episode":DS.attr("number"),
    "episode-title":DS.attr("string"),
    "type":DS.attr("string"),
    "filesize":DS.attr("number"),
    "bitrate":DS.attr("number"),
    "width":DS.attr("number"),
    "height":DS.attr("number"),

    "percent-watched":Ember.computed("fileduration", "play-position.position", function()
    {
        var pos = this.get("play-position.position");
        var val = "0";
        if(pos&&this.get("fileduration")) {
            val = Math.ceil(pos / this.get("fileduration") * 100);
        }
        console.log(val);
        return Ember.String.htmlSafe("width:"+val+"%");
    }),

    "filedurationReadable":Ember.computed("fileduration", function(){
        return Math.round(this.get("fileduration")/60)+"m";
    }),

    "rating":Ember.computed("vote-average", function()
    {
        return this.get('vote-average') * 10;
    }),
    "backdrop-img-style":Ember.computed("backdrop-path", function()
    {
        return Ember.String.htmlSafe("background-image:url(/img/"+this.get("id")+"_backdrop.jpg)");
    }),
    "poster-img":Ember.computed("poster-path", function()
    {
        return Ember.String.htmlSafe("/img/"+this.get("id")+"_poster.jpg");
    }),
    "poster-img-style":Ember.computed("poster-path", function()
    {
        return Ember.String.htmlSafe("background-image:url(/img/"+this.get("id")+"_poster.jpg)");
    }),
    "poster-img-thumb-style":Ember.computed("poster-path", function()
    {
        return Ember.String.htmlSafe("background-image:url(/img/"+this.get("id")+"_postersmall.jpg)");
    })
});