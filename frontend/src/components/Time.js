import React, {Component} from 'react';

class ButtonMenu extends Component {
  render() {
    let seconds = Math.floor(this.props.children%60)+"";
    let minutes = Math.round(this.props.children/60)+"";
    const hours = Math.round(this.props.children/60/60);
    if(seconds.length<2){
      seconds="0"+seconds;
    }
    if(minutes.length<2){
      minutes="0"+minutes;
    }
    return (<span style={this.props.style} className="time">{hours}:{minutes}:{seconds}</span>)

  }
}

export default ButtonMenu;
