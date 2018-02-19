import React, {Component} from 'react';
import {Icon} from 'react-materialize';
import Chromecast from '../../helpers/ChromeCast';

class CastButton extends Component {
  constructor() {
    super();
    this.castingChange = this.castingChange.bind(this);
  }

  componentWillMount() {
    Chromecast.addListener(Chromecast.EVENT_CASTING_CHANGE, this.castingChange);
    this.setState({available: Chromecast.isAvailable(), active:Chromecast.isActive()});
  }

  castingChange(active) {
    this.setState({active});
  }

  onClick() {
    if(this.state.active) {
      return Chromecast.stopCasting();
    }
    Chromecast.startCasting();
  }

  render() {
    if(!this.state.available) {
      return null;
    }
    return <span className={"cast"+(this.state.active?" active":"")} onClick={this.onClick.bind(this)}>
      <Icon>cast</Icon>
    </span>;
  }
}

export default CastButton;
