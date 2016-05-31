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

    "backdrop-img-style":Ember.computed("backdrop-path", function()
    {
        return "background-image:url(https://image.tmdb.org/t/p/w1280/"+this.get("backdrop-path")+")";
    }),
    "poster-img":Ember.computed("poster-path", function()
    {
        return "https://image.tmdb.org/t/p/w300/"+this.get("poster-path")+"";
    }),
    "poster-img-thumb-style":Ember.computed("poster-path", function()
    {
        return "background-image:url(https://image.tmdb.org/t/p/w150/"+this.get("poster-path")+")";
    })
});