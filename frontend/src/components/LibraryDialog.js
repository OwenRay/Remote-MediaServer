/**
 * Created by owenray on 6/30/2017.
 */
import React, { PureComponent } from 'react';
import { Select, Row, Button, Modal, TextInput, Checkbox } from 'react-materialize';
import PropTypes from 'prop-types';
import ServerFileBrowser from './ServerFileBrowser';

class LibraryDialog extends PureComponent {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.fileBrowserChange = this.fileBrowserChange.bind(this);
    this.state = { name: '', folder: '', type: '' };
  }

  /**
   * get the state from the passed arguments
   */
  componentWillMount() {
    this.setState(this.props.editing);
  }

  /**
   * @param e
   * called when user types in field, applies typed value to state
   */
  onChange(e) {
    const o = {};
    o[e.target.name] = e.target.value;
    this.setState(o);
  }

  /**
   * called when closing the modal
   */
  onClose() {
    if (this.props.onClose) {
      this.props.onClose();
    }
  }

  /**
   * save settings, called when submit is clicked
   */
  onSubmit() {
    if (this.props.onSave) {
      this.props.onSave(this.state);
    }
    this.onClose();
  }

  /**
   * called when the input changes
   * @param val
   */
  fileBrowserChange(val) {
    this.setState({ folder: val });
  }

  sharedOrOther() {
    if (this.state.type === 'shared') {
      return <TextInput value={this.state.uuid} name="uuid" onChange={this.onChange} s={12} label="Code" />;
    }
    return (
      <Row>
        <Checkbox
          type="checkbox"
          name="shared"
          onChange={this.onChange}
          label="Share this library"
          checked={this.state.shared}
        />
        <ServerFileBrowser value={this.state.folder} onChange={this.fileBrowserChange} label="Directory" />
      </Row>
    );
  }

  render() {
    console.log(this.props.onLibraryClose);
    return (
      <Modal
        open
        actions={[
          <Button modal="close">close</Button>,
          <Button onClick={this.onSubmit} modal="confirm">confirm</Button>,
        ]}
        options={{
          onCloseEnd: this.props.onClose,
        }}
      >
        <h4>Add library</h4>
        <Row>
          <Select value={this.state.type} name="type" onChange={this.onChange} label="Type" s={12}>
            <option value="folder">Unspecified</option>
            <option value="tv">TV Shows</option>
            <option value="movie">Movies</option>
            <option value="library_music">Music</option>
            <option value="shared">External Library</option>
          </Select>
          <TextInput defaultValue={this.state.name} onChange={this.onChange} name="name" s={12} label="Name" />
          {this.sharedOrOther()}
        </Row>
      </Modal>
    );
  }
}

LibraryDialog.propTypes = {
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  editing: PropTypes.object.isRequired,
};


export default LibraryDialog;

