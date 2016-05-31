import Ember from 'ember';

export function timeFormat(params/*, hash*/) {
  var hours = Math.floor(params/(60*60));
  params-=hours*60*60;
  var minutes = Math.floor(params/60);
  var seconds = Math.round(params%60);
  if(minutes<10)
  {
    minutes = "0"+minutes;
  }
  if(seconds<10)
  {
    seconds = "0"+seconds;
  }
  return hours+":"+minutes+":"+seconds;
}

export default Ember.Helper.helper(timeFormat);
