import Ember from 'ember';
import DS from 'ember-data';

export default Ember.Controller.extend({
    queryParams: ['selectedTab'],
    store: Ember.inject.service("store"),
    selectedTab:-1,

    seasons:Ember.computed("allEpisodes", function(){
        console.log("daar");
        return DS.PromiseObject.create({
            promise: this.get("allEpisodes").then(function(episodes){
                var seasons = Ember.A();
                episodes.forEach(function(episode){
                    console.log(episode.get("season"));
                    seasons.push(episode.get("season")|0);
                });
                return Ember.A(seasons).uniq();
            })

        });
    }),

    allEpisodes:Ember.computed("model.external-id", function(){
        console.log("hier");
        return this.get("store").query("media-item", {"external-id":this.get("model.external-id"), "sort":"season,episode"});
    }),

    actions:{
        play()
        {
            this.transitionToRoute("item.view", this.get("model"));
        }

    }
});
