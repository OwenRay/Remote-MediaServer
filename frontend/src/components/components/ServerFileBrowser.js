/**
 * Created by owenray on 7/4/2017.
 */
/* global $ */
import React, {Component} from 'react';
import {CollectionItem, Collection, Preloader, Input, Row} from 'react-materialize';
import PropTypes from 'prop-types';

class ServerFileBrowser extends Component {
 constructor(props){
   super(props);
   console.log(props.onChange);
   this.state = {value: "/"};
 }

  componentDidMount() {
    this.update(this.state.value);
  }

  update(val) {
   if(this.state!=val) {
     this.props.onChange();
   }
    this.setState({value:val, loading: true});
    $.getJSON(
      "/api/browse",
      {"directory": val}
    ).then(
      (data) => {//success
        this.setState(
          {
            loading: false,
            error: data.error ? "Could not list directory" : "",
            directories: data.result
          }
        );
      },
      () => {//fail
        this.setState(
          {
            loading: false,
            error: "Could not list directory",
            directories: []
          }
        );
      }
    );
  }

  goUp() {
    return <CollectionItem key=".." onClick={()=>{this.onClick("..")}}>Go up</CollectionItem>;
  }

  valueChange(e) {
   console.log("hier?");
   this.update(e.target.value);
  }

  onClick(dir) {
   var val = this.state.value;
   if(!val.endsWith("/")) {
     val+="/";
   }
   if(dir==="..") {
     var parts = val.split("/");
     parts.pop();
     parts.pop();
     val = parts.join("/");
     if(!val) {
       val = "/";
     }
   }else {
     val += dir;
   }
   this.update(val);
  }

  render() {
    let contents = <CollectionItem></CollectionItem>;

    if (!this.state || this.state.loading) {
      contents = <Preloader flashing/>;
    } else if (this.state.error) {
      contents = <Collection>
                  {this.goUp()}
                  <CollectionItem>{this.state.error}</CollectionItem>
                </Collection>;
    } else if(this.state.directories){
      let dirs = this.state.directories.map(
        (dir)=><CollectionItem key={dir} onClick={()=>{this.onClick(dir)}}>{dir}</CollectionItem>
      );
      contents =
        <Collection>
          {this.goUp()}
          {dirs.length?dirs:<CollectionItem className="no-link">Empty directory</CollectionItem>}
        </Collection>

    }

    return (
      <div>
        <Row>
          <Input onChange={this.valueChange.bind(this)} s={12} label={this.props.label} value={this.state.value}/>
        </Row>
        <div className="directoryList">
          {contents}
        </div>
      </div>
    );
  }
}

ServerFileBrowser.propTypes = {
  optionalValue: PropTypes.string,
  optionalOnChange: PropTypes.symbol
};

export default ServerFileBrowser;
