import Ember from 'ember';

export default Ember.Controller.extend({
    queryParams:["selectedTab"],
    settings: Ember.inject.service('settings'),
    selectedLibrary:null,
    creatingNewLibrary:null,
    selectedTab:"server",
    libraryTypes:Ember.A(
        [
            {value:"folder", label:"Unspecified"},
            {value:"tv", label:"TV Shows"},
            {value:"movie", label:"Movies"},
            {value:"library_music", label:"Music"}
        ]
    ),
    deletingLibrary:null,

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

        deselectLibrary()
        {
            this.set("selectedLibrary", null);
        },

        selectLibrary(item)
        {
            this.set("selectedLibrary", item);
        },

        addLibrary()
        {
            this.set("creatingNewLibrary", true);
            this.set("selectedLibrary", {"folder":"/"});
        },

        deleteLibrary(library)
        {
            this.set("deletingLibrary", library);
            return false;
        },

        confirmDelete()
        {
            var libraries = this.get("settings.model.libraries");
            var i = libraries.indexOf(this.get("deletingLibrary"));
            libraries.splice(i, 1);
            //the extra splice is to trigger the object reference change, so the interface is updated
            this.set("settings.model.libraries", libraries.splice(0, libraries.length));
            this.set("deletingLibrary", null);
            this.get("settings.model").save();
        }
    }
});
