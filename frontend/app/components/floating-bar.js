import Ember from 'ember';

export default Ember.Component.extend({
    classNameBindings: ["hidden"],
    hidden:false,
    selector:"",
    scroller:null,
    lastScrollTop:0,
    lastScrollUpPos:0,

    didInsertElement()
    {
        var scroller = this.$().parent().find(this.get("selector"));
        this.set("scroller", scroller);
        scroller.scroll(this.didScroll.bind(this));
    },

    didScroll(e)
    {
        var scrollTop = this.get("scroller").scrollTop();
        var diff = this.get("lastScrollTop")-scrollTop;
        this.set("lastScrollTop", scrollTop);
        if(diff>0)
        {
            console.log("hier");
            this.set("hidden", false);
            this.set("lastScrollUpPos", scrollTop);
        }
        if(scrollTop-this.get("lastScrollUpPos")>50)
        {
            this.set("hidden", true);
        }
        //if(this.get("lastScrollUpPos")-scrollTop)
    }
    
});
