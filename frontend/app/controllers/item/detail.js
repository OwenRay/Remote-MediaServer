import Ember from 'ember';
import DS from 'ember-data';

export default Ember.Controller.extend({
    queryParams: ['selectedTab'],
    store: Ember.inject.service("store"),
    selectedTab:-1,
    showDetails:false,
    detailItems_arr: {
                    year: "Year",
                    "filepath": "File",
                    season: "Season",
                    episode: "Episode",
                    "episode-title": "Episode title",
                    "release-date": "Release date",
                    "fileduration":"Duration",
                    "filesize":"File size",
                    "bitrate":"Bitrate",
                    "width":"Width",
                    "height":"Height"
                },

    detailItems:Ember.computed("model", function(){
        var arr = this.get("detailItems_arr");
        var ret = [];
        for(var key in arr)
        {
            ret.push({title:arr[key], value:this.get("model."+key)});
        }
        return ret;
    }),

    seasons:Ember.computed("allEpisodes", function(){
        return DS.PromiseObject.create({
            promise: this.get("allEpisodes").then(function(episodes){
                var seasons = Ember.A();
                episodes.forEach(function(episode){
                    seasons.push(episode.get("season")|0);
                });
                return Ember.A(seasons).uniq();
            })

        });
    }),

    allEpisodes:Ember.computed("model.external-id", function(){
        return this.get("store")
                    .query(
                        "media-item",
                        {
                            "external-id":this.get("model.external-id"),
                            "sort":"season,episode",
                            "join":"play-position",
                            "extra":"false"
                        }
                    );

    }),

    watched:Ember.computed("model.fileduration", "model.play-position.position", function(){
        return this.get("model.fileduration")&&this.get("model.play-position.position")&&
                this.get("model.play-position.position")/this.get("model.fileduration")>0.99;
    }),

    ratingWidth: Ember.computed("model.rating", function(){
        return Ember.String.htmlSafe("width:"+this.get("model.rating")+"%");
    }),

    extras:Ember.computed("model.id", function() {
         var q = {"extra":true};
         if(this.get("model.type")==="tv") {
            q["external-episode-id"] = this.get("model.external-episode-id");
         }else {
            q["external-id"] = this.get("model.external-id");
         }
         return this.store.query("media-item", q);
    }),

    actions:{
        play()
        {
            this.transitionToRoute("item.view", this.get("model"));
        },

        toggleDetails()
        {
            this.set("showDetails", !this.get("showDetails"));
        },

        toggleWatched()
        {
            var pos = this.get("model.play-position");
            if(!this.get("model.play-position.id"))
            {
                pos = this.store.createRecord("play-position");
            }else{
                pos = this.store.peekRecord("play-position", this.get("model.play-position.id"));
            }
            pos.set("position", this.get("watched")?0:this.get("model.fileduration"));

            this.set("model.play-position", pos);
            pos.save().then(function(){
                this.get("model").save();
            }.bind(this));
        }

    }
});
