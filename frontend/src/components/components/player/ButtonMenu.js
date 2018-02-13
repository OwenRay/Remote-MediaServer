import React, {Component} from 'react';
import {Button} from "react-materialize";

class SeekBar extends Component {

  shouldComponentUpdate() {
    return false;
  }

  onSelect(item) {
    this.props.onSelect(this.props.type, item.value)
  }

  render() {
    const items = this.props.items;
    const type = this.props.type;
    if(!items||(items.length<=1&&type!=="subtitles")) {
      return (<div></div>);
    }
    return (
      <Button
        icon={{video:"videocam", audio:"audiotrack", subtitles:"subtitles"}[type]}
        fab="vertical"
        floating>
        <div className="collection">
          {items.map((item,key)=>
            <a className="collection-item" key={key} onClick={()=>{this.onSelect(item)}}>
              {item.label}
            </a>
          )}
        </div>
      </Button>
    )
  }
}

export default SeekBar
