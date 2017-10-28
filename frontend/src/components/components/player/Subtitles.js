import React, {Component} from 'react';
import {Button} from "react-materialize";
import * as ReactDOM from "react-dom";

class Subtitles extends Component {
  listClick(title) {
    const textTracks = document.getElementById("videoPlayer").textTracks;
    console.log(textTracks);
    for (let i = 0; i < textTracks.length; i++){
      if (textTracks[i].id === title){
        textTracks[i].mode = textTracks[i].mode === "showing"?"hidden":"showing";
      } else {
        textTracks[i].mode = "hidden";
      }
    }
  }

  render() {
    if (this.props.subtitles !== null){
      this.props.subtitles
        .map((sub) => <track kind={"subtitles"} src={"/api/mediacontent/subtitle/" + this.props.id.toString() + "/" + sub.value} id={sub.value} mode="hidden"/>)
        .forEach(function(element) {
           ReactDOM.render(element, document.getElementById("videoPlayer"));
         });
      let subList = this.props.subtitles.map((sub) => <li onClick={this.listClick.bind(this, sub.value)} key={sub.label}>{sub.label}</li>);
      return(
        <Button icon="closed_caption" action="firstAction" floating className="fixed-action-btn">
          <ul>
            {subList}
          </ul>
        </Button>
      )
    }
    return null;
  }
}

export default Subtitles
