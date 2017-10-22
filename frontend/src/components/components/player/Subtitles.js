import React, {Component} from 'react';
import {Button} from "react-materialize";
import $ from "jquery";
import * as ReactDOM from "react-dom";

class Subtitles extends Component {

  listClick(title) {
    let vid = this.props.videoTag;
    $.ajax({
      url: "/api/mediacontent/subtitle/" + this.props.id.toString() + "/" + title,
      success: function(result) {
        ReactDOM.render(<script>{result}</script>, document.getElementById("testID"));
        console.log(result);
      }
    });
  }

  render() {
    if (this.props.subtitles !== null){
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
