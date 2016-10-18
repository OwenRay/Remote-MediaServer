import Ember from 'ember';

export default Ember.Component.extend({
    showBackButton:false,

    actions:{
        onBackPressed()
        {
            window.history.back();
        }
    }
});
