import Ember from 'ember';

export default Ember.Controller.extend({
    queryParams: ['filters.libraryId', 'filters.sort', "filters.title"],
    settings: Ember.inject.service('settings'),
    filters:{libraryId:"", sort:"title", title:""},

    impaginationReset:null,
    dataSet:null,
    filterClass:"filterClosed",

    init()
    {
        for(var key in this.get("filters")) {
            this.addObserver("filters."+key, this.onQueryChange);
        }
        //this.addObserver("sort", this.onQueryChange);
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
            {value:"date_added:DESC", label:"Date added"},
            {value:"release-date:DESC", label:"Date released"}
        ]
    ),

    libraryOptions:Ember.computed("settings.model.libraries", function()
    {
        var s = this.get("settings.model.libraries").slice(0);
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
        },

        filterClick:function()
        {
            this.set(
                    "filterClass",
                    this.get("filterClass")==="filterClosed"?"filterOpen":"filterClosed"
                );
        }
    }
});
