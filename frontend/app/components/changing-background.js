import Ember from 'ember';

export default Ember.Component.extend({
    classNames:["movie-detail-backdrop"],
    attributeBindings: ['style'],
    dataSet:null,
    style:"",
    timeOut:null,

    didInsertElement()
    {
        this.tick();
    },

    didDestroyElement()
    {
        Ember.run.cancel(this.get("timeOut"));
    },

    tick()
    {
        if(this.isDestroyed) {
            return;
        }

        var ds = this.get("dataSet");
        if(ds&&ds.length>0&&ds.objectAt(0).content) {
            //console.log(ds.objectAt(0).content.get("backdrop-img-style"), ds.dataset[]);
            while(true) {
                var model = ds.objectAt(Math.round(Math.random() *ds.length)).content;
                if(!model) {
                    continue;
                }

                this.set("style", model.get("backdrop-img-style"));
                break;
            }
        }
        var tick = Ember.run.later(this, this.tick, 5000);
        this.set("timeOut", tick);
    }
});
