/**
 * Created by owenray on 6/30/2017.
 */
/* global $ */
import React, {Component} from 'react';
import {Input, Row, Button, Modal} from 'react-materialize';
import ServerFileBrowser from '../components/ServerFileBrowser';
import PropTypes from 'prop-types';

class LibraryDialog extends Component {

  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.state = {name:"", folder:"", type:""};
  }

  /**
   * get the state from the passed arguments
   */
  componentDidMount() {
    console.log(this.props.editing);
    this.setState(this.props.editing);
  }

  /**
   * make sure the modal closes before object is destroyed (to hide the transparent background)
   */
  componentWillUnmount() {
    $("#createModal").modal('close');
  }

  /**
   * @param e
   * called when user types in field, applies typed value to state
   */
  onChange(e) {
    let o = {};
    o[e.target.name] = e.target.value;
    this.setState(o);
  }

  /**
   * called when the input changes
   * @param val
   */
  fileBrowserChange(val) {
    this.setState({"folder":val});
  }

  /**
   * save settings, called when submit is clicked
   */
  onSubmit() {
    if(this.props.onSave) {
      this.props.onSave(this.state);
    }
    this.onClose();
  }

  /**
   * called when closing the modal
   */
  onClose() {
    if(this.props.onClose) {
      this.props.onClose();
    }
  }

  /**
   * make sure the modal is always open
   */
  componentDidUpdate() {
    $("#createModal").modal({'complete':()=>{
        this.onClose();
      }})
      .modal('open');
  }

  render() {
    return (
      <Modal
        ref={(modal)=>{this.modal=modal}}
        id="createModal"
        actions={[
          <Button modal="close">close</Button>,
          <Button onClick={this.onSubmit} modal="confirm">confirm</Button>,
        ]}>
        <h4>Add library</h4>
        <Row>
          <Input value={this.state.type} name="type" onChange={this.onChange} label="Type" s={12} type="select">
            <option value="folder">Unspecified</option>
            <option value="tv">TV Shows</option>
            <option value="movie">Movies</option>
            <option value="library_music">Music</option>
          </Input>
          <Input value={this.state.name} onChange={this.onChange} name="name" s={12} label="Name"/>
          <ServerFileBrowser value={this.state.folder} onChange={this.fileBrowserChange.bind(this)} label="Directory"/>
        </Row>
      </Modal>
    );
  }
}

LibraryDialog.propTypes = {
  onSave: PropTypes.func,
  onClose: PropTypes.func,
  editing: PropTypes.object
};


export default LibraryDialog;

