import Ember from 'ember';
import config from "../config/environment";

export default Ember.Component.extend({
    value:null,
    loading: true,
    error: false,
    directories:[],

    didInsertElement()
    {
        this.addObserver("value", this.update);
        this.update();
    },
    
    empty:Ember.computed("error", "directories", function(){
        return !this.get("error")&&this.get("directories").length===0;
    }),

    showUp:Ember.computed("value", function(){
        return this.get("value")&&this.get("value")!=="/";
    }),

    update()
    {
        this.set("loading", true);
        Ember.$
            .getJSON(
                config.APP.host+"/"+config.APP.namespace+"/browse",
                {"directory":this.get("value")}
            )
            .then(
                function(data){//success
                    this.set("loading", false);
                    this.set("error", data.error?"Could not list directory":"");
                    this.set("directories", data.result);
                }.bind(this),
                function(){//fail
                    this.set("loading", false);
                    this.set("error", "Could not list directory");
                    this.set("directories", []);
                }.bind(this)
            );
    },

    actions:{
        directoryClick(dir)
        {
            this.set("value", (this.get("value")?this.get("value"):"")+"/"+dir);
            console.log(dir);
        },

        up(dir)
        {
            var parts = this.get("value").split("/");
            while(parts.length>0&&!parts.pop()){}

            this.set("value", parts.join("/"));
            console.log(dir);
        }
    }
});
