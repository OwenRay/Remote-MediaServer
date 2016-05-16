import Ember from 'ember';

export default Ember.Controller.extend({
    queryParams: ['library', 'sort'],
    settings: Ember.inject.service('settings'),
    library:"",
    sort:"title",

    impaginationReset:null,
    dataSet:null,

    init()
    {
        this.addObserver("library", this.onQueryChange);
        this.addObserver("sort", this.onQueryChange);
    },

    onQueryChange()
    {
        if(!this.get("impaginationReset"))
        {
            return;
        }
        this.get("impaginationReset")(0);
    },

    libraryTypes:Ember.A(
        [
            {value:"", label:"All libraries"},
            {value:"tv", label:"TV Shows"},
            {value:"movie", label:"Movies"},
            {value:"library_music", label:"Music"}
        ]
    ),
    sortTypes:Ember.A(
        [
            {value:"title", label:"Title"},
            {value:"date_added", label:"Date added"},
            {value:"date_released", label:"Date released"}
        ]
    ),

    libraryOptions:Ember.computed("settings.model.libraries", function()
    {
        var s = this.get("settings.model.libraries");
        s.unshift({"name":"All libraries", "uuid":""});
        return s;
    }),

    title:Ember.computed("model.info", "model.items.length", function()
    {
        return this.get("model.info.name")+ "("+this.get("model.items.length")+")";
    }),

    actions:{
        observeDataset:function(dataset, actions)
        {
            this.set("dataSet", dataset);
            this.set("impaginationReset", actions.reset.bind(dataset));
        }
    }
});
