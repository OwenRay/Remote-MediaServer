import Ember from 'ember';

export default Ember.Component.extend({
    classNames:["movie-detail-backdrop"],
    attributeBindings: ['style'],
    dataSet:null,
    style:"",

    didInsertElement()
    {
        console.log("initBg");
        this.tick();
    },

    tick()
    {
        if(this.isDestroyed) {
            return;
        }
        console.log("tick");
        var ds = this.get("dataSet");
        console.log(ds);
        if(ds&&ds.length>0&&ds.objectAt(0).content) {
            //console.log(ds.objectAt(0).content.get("backdrop-img-style"), ds.dataset[]);
            while(true) {
                var model = ds.objectAt(Math.round(Math.random() *ds.length)).content
                if(!model)
                    continue;

                this.set("style", model.get("backdrop-img-style"));
                break;
            }
        }
        Ember.run.later(this, this.tick, 5000);
    }
});
