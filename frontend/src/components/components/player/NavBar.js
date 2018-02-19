import React, {Component} from 'react';
import {Button} from "react-materialize";
import ButtonMenu from "./ButtonMenu";

class NavBar extends Component {

  playPauseButton() {
    if (this.props.paused){
      return <Button id="play-pause" floating large icon='play_arrow' onClick={this.props.togglePause}/>
    } else {
      return <Button id="play-pause" floating large icon='pause' onClick={this.props.togglePause}/>
    }
  }

  async componentWillReceiveProps (nextProps) {
    if(!this.state||!this.state.mediaContent)
      this.setState({mediaContent:nextProps.mediaContent});
  }

  selected(type, item) {
    this.props.onSelectContent(type, item.value);
  }

  render() {
    if(!this.props.mediaContent) {
      return <div></div>;
    }
    return (
      <div className={"controls ".concat(this.props.navClass)}>
        <img alt="poster" src={this.props.item?"/img/"+this.props.item.id+"_poster.jpg":""}/>
        <Button id="prev" floating icon="skip_previous"/>
        {this.playPauseButton()}
        <Button id="next" floating icon="skip_next"/>
        <div className="buttonsRight">
          {/**
           Add channel selection logic
           */}
          <ButtonMenu onSelect={this.props.onSelectContent} type="audio" items={this.props.mediaContent["audio"]}/>
          <ButtonMenu onSelect={this.props.onSelectContent} type="video" items={this.props.mediaContent["video"]}/>
          <ButtonMenu onSelect={this.props.onSelectContent} type="subtitles" items={this.props.mediaContent["subtitles"]}/>
          <Button id="fullscreen" floating icon="fullscreen" onClick={this.props.toggleFullScreen}/>
        </div>
        {this.props.children}
      </div>
    )
  }
}

export default NavBar
