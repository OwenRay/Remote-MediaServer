/* eslint-disable no-underscore-dangle */
/**
 * Created by owenray on 6/30/2017.
 */
/* global $ */
import React, { Component } from 'react';
import { Tabs, Tab, Card, Input, Row, Button, Icon, Collection, CollectionItem, Modal } from 'react-materialize';
import { apiActions, deserialize } from 'redux-jsonapi';
import store from '../helpers/stores/settingsStore';
import LibraryDialog from '../components/LibraryDialog';

class Settings extends Component {
  constructor() {
    super();
    this.state = { activeTab: 0 };
  }

  componentDidMount() {
    store.subscribe(this.change.bind(this));
    this.onChange = this.onChange.bind(this);
    this.onTabChange = this.onTabChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onLibrarySave = this.onLibrarySave.bind(this);
    this.onLibraryClose = this.onLibraryClose.bind(this);
    this.change();
  }

  /**
   * Make sure the deletmodal opens when it's rendered
   */
  componentDidUpdate() {
    $('#deleteModal').modal({
      complete: () => {
        this.setState({ removing: null });
      },
    })
      .modal('open');
  }

  /**
   * save settings, called when submit is clicked
   */
  onSubmit() {
    const o = this.state.settings;
    o._type = 'settings';
    store.dispatch(apiActions.write(o));
  }

  /**
   * called the library creating dialog wants to persist the edited data
   * @param lib
   */
  onLibrarySave(lib) {
    const o = this.state.settings;
    // are we replacing an existing item?
    o.libraries = o.libraries.map(item => (lib.uuid === item.uuid ? lib : item));

    if (!o.libraries.find(item => lib.uuid === item.uuid)) {
      o.libraries.push(lib);
    }
    this.setState({ settings: o });
    this.onSubmit();
  }

  /**
   * Gets called when the library dialog closes
   */
  onLibraryClose() {
    this.setState({ create: null });
  }

  onTabChange(tab) {
    this.setState({ activeTab: parseInt(tab, 10) % 10 });
  }

  /**
   * @param e
   * called when user types in field, applies typed value to state
   */
  onChange(e, value) {
    const { settings } = this.state;
    settings[e.target.name] = value;
    this.setState({ settings });
  }

  /**
   * triggered when the settings model changes
   */
  change() {
    const { api } = store.getState();
    if (!api.setting) {
      return;
    }
    this.setState({
      settings: deserialize(api.setting[1], store),
    });
  }

  /**
   * @param lib
   * Called when creating a new library or when clicking an existing one
   */
  librarySelect(lib) {
    this.setState({ create: lib });
  }

  /**
   * @param lib library object
   * @param confirm confirmed via dialog?
   *
   * Remove library
   */
  removeLib(lib, confirm) {
    if (confirm === undefined) {
      this.setState({ removing: lib });
    } else {
      $('#deleteModal').modal('close');
      if (confirm) {
        this.state.settings.libraries.splice(this.state.settings.libraries.indexOf(lib), 1);
        this.onSubmit();
      }
      this.setState({ removing: null });
    }
  }

  render() {
    if (!this.state || !this.state.settings) {
      return (<p>Loading</p>);
    }

    const listItems = this.state.settings.libraries.map(lib => (
      <CollectionItem
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          this.librarySelect(lib);
        }}
        key={`key${lib.uuid}`}
      >
        {lib.name}
        <Button
          icon="delete"
          onClick={(e) => {
            e.stopPropagation();
            this.removeLib(lib);
          }}
        />
      </CollectionItem>));

    let deletingModal;
    if (this.state.removing) {
      deletingModal = (
        <Modal
          id="deleteModal"
          actions={[
            <Button modal="close">close</Button>,
            <Button onClick={() => this.removeLib(this.state.removing, true)} modal="confirm">confirm</Button>,
          ]}
        >
          <h4>Deleting &quot;{this.state.removing.name}&quot;</h4>
          Are you sure your want to delete &quot;{this.state.removing.name}&quot;?
        </Modal>);
    }

    return (
      <div>
        <Tabs
          key="settingstabs"
          onChange={this.onTabChange}
          className="tabs-fixed-width"
        >
          <Tab
            key="1"
            active={this.state.activeTab === 0}
            title="Server settings"
          />
          <Tab
            key="2"
            active={this.state.activeTab === 1}
            title="Media library"
          />
        </Tabs>
        {this.state.activeTab === 0 ?
          <Card
            title="Server settings"
            actions={[<Button key="save" onClick={this.onSubmit}><Icon left>save</Icon>Save</Button>]}
          >
            <Row>
              <Input
                name="name"
                onChange={this.onChange}
                defaultValue={this.state.settings.name}
                icon="label"
                label="Server name"
                s={12}
              />
              <Input
                name="port"
                onChange={this.onChange}
                defaultValue={`${this.state.settings.port}`}
                icon="input"
                label="Port"
                s={12}
              />
              <Input
                s={12}
                name="filewatcher"
                onChange={this.onChange}
                type="select"
                label="File watcher"
                defaultValue={this.state.settings.filewatcher}
                icon="remove_red_eye"
              >
                <option value="native">Use native filesystem events</option>
                <option value="polling">Alternative (Polling)</option>
              </Input>
              <Input
                type="checkbox"
                name="startscan"
                onChange={this.onChange}
                label="Full rescan on start"
                checked={this.state.settings.startscan}
              />
            </Row>
          </Card> : ''}
        {this.state.activeTab === 1 ?
          <Card
            title="Media library"
            actions={[<Button key="new" onClick={() => this.librarySelect({})}><Icon left>add</Icon>Add new</Button>]}
          >
            <Collection>
              {listItems}
            </Collection>
          </Card> : ''}

        {deletingModal}
        {this.state.create && <LibraryDialog
          onSave={this.onLibrarySave}
          onClose={this.onLibraryClose}
          editing={this.state.create}
        />}
      </div>
    );
  }
}

export default Settings;

