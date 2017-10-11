import React, {Component} from 'react';
import {Button} from "react-materialize";

class Subtitles extends Component {
  render() {
    if (this.props.subtitles !== null){
      let subList = this.props.subtitles.map((sub) => <ul>{sub.label}</ul>);
      return(
        <Button icon="closed_caption" action="firstAction" floating className="fixed-action-btn">
          {subList}
        </Button>
      )
    }
    return null;
  }
}

export default Subtitles
