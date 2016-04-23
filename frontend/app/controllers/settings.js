import Ember from 'ember';

export default Ember.Controller.extend({
    settings: Ember.inject.service('settings'),
    selectedLibrary:null,
    creatingNewLibrary:null,

    actions:{
        save()
        {
            if(this.get("creatingNewLibrary"))
            {
                console.log("add to", this.get("settings.model.libraries"));
                this.get("settings.model.libraries")
                    .push(this.get("selectedLibrary"));
                this.set("creatingNewLibrary", false);
            }
            this.set("selectedLibrary", null);
            this.get("settings.model").save();
        },

        selectLibrary(item)
        {
            this.set("selectedLibrary", item);
        },

        addLibrary()
        {
            this.set("creatingNewLibrary", true);
            this.set("selectedLibrary", {});
        }
    }
});
