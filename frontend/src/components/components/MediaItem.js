/**
 * Created by owenray on 19/07/2017.
 */

import React, {Component} from 'react';
import {Button, Preloader} from 'react-materialize';
import {NavLink} from 'react-router-dom';
import PropTypes from 'prop-types';

class MediaItem extends Component {

  constructor(props) {
    super(props);
    if(props.mediaItem.index) {
      //this.state = {index:props.mediaItem};
      props.requestData(props.mediaItem.index).then(this.gotData.bind(this));
      return;
    }

    this.state = props.mediaItem;
  }

  gotData(data) {
    //this.setState({mediaItem:data});
  }

  playPos() {
    if (this.state.playPosition) {
      return (
        <div className="percent-played">
          <div style={{width: this.state.playPosition().position / this.state.fileduration * 100 + "%"}}></div>
        </div>
      );
    }
  }

  render() {
    if(!this.state) {
      return (
        <div className="grid-item">
          <Preloader size='small'/>
        </div>
      );
    }
    return (
      <div className="grid-item">
        <div
          className="poster"
          data-poster-image={this.state.id}
          style={{"backgroundImage": "url(/img/" + this.state.id + "_postersmall.jpg)"}}/>
        <NavLink to={"item/detail/" + this.state.id}></NavLink>
        <div className="detail">
          {this.playPos()}
          <Button
            floating
            className="play"
            icon='play_arrow'
            action='play'/>
          <span className="title">{this.state.title}</span>
          <span className="year">{this.state.year}</span>
        </div>
      </div>
    );
  }
}

MediaItem.propTypes = {
  mediaItem: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
};

export default MediaItem;
