import React, { Component } from 'react';
import { Button } from 'react-materialize';

class ButtonMenu extends Component {
  shouldComponentUpdate() {
    return false;
  }

  onSelect(item) {
    this.props.onSelect(this.props.type, item.value);
  }

  render() {
    const { items, type } = this.props;
    if (!items || items.length <= 1) {
      return (<div />);
    }
    return (
      <Button
        icon={{ video: 'videocam', audio: 'audiotrack', subtitles: 'subtitles' }[type]}
        fab="vertical"
        floating
      >
        <div className="collection">
          {items.map(item =>
            (<span className="collection-item" key={item.value} onClick={() => { this.onSelect(item); }}>
              {item.label}
             </span>))}
        </div>
      </Button>
    );
  }
}

export default ButtonMenu;
