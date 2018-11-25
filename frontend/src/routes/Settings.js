/* eslint-disable no-underscore-dangle */
/**
 * Created by owenray on 6/30/2017.
 */
/* global $ */
import React, { Component } from 'react';
import { Card, Input, Row, Col, Button, Icon, Collection, CollectionItem, Modal } from 'react-materialize';
import { apiActions, deserialize } from 'redux-jsonapi';
import Slider from 'rc-slider';
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
  async onSubmit() {
    const o = this.state.settings;
    o._type = 'settings';
    await store.dispatch(apiActions.write(o));
    window.Materialize.toast('Settings saved', 3000);
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
    console.log(e.target.name, arguments);
    const { settings } = this.state;
    settings[e.target ? e.target.name : e] = value;
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
    console.log(this.state);
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

    const { settings } = this.state;

    const listItems = settings.libraries.map(lib => (
      <CollectionItem
        onClick={(e) => {
          console.log('click!!');
          e.stopPropagation();
          e.preventDefault();
          console.log('clicked', e, lib);
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
      <div className={settings.advanced ? 'advanced' : ''}>
        <Button
          className="bottom-right-fab"
          key="save"
          floating
          onClick={this.onSubmit}
          icon="save"
        />
        <Row style={{ margin: 20, float: 'right' }}>
          <Input
            type="checkbox"
            checked={settings.advanced}
            onChange={this.onChange}
            name="advanced"
            label="Show advanced"
          />
        </Row>
        <Card
          title="Server settings"
        >
          <Row>
            <Input
              name="name"
              onChange={this.onChange}
              defaultValue={settings.name}
              icon="label"
              label="Server name"
              s={12}
            />
          </Row>
          <Row className="advancedItem">
            <Input
              name="port"
              onChange={this.onChange}
              defaultValue={`${settings.port}`}
              icon="input"
              label="Port"
              s={12}
            />
          </Row>
          <Row className="advancedItem">
            <Input
              s={12}
              name="filewatcher"
              onChange={this.onChange}
              type="select"
              label="File watcher"
              defaultValue={settings.filewatcher}
              icon="remove_red_eye"
            >
              <option value="native">Use native filesystem events</option>
              <option value="polling">Alternative (Polling)</option>
            </Input>
          </Row>
          <Row>
            <Input
              type="checkbox"
              name="startscan"
              onChange={this.onChange}
              label="Full rescan on start"
              checked={settings.startscan}
            />
          </Row>
        </Card>
        <Card
          title="Share settings"
        >
          <Row className="advancedItem">
            <Input
              name="sharehost"
              onChange={this.onChange}
              defaultValue={`${settings.sharehost}`}
              icon="input"
              label="Sharing host (empty for autodetect)"
              s={6}
            />
            <Input
              name="shareport"
              onChange={this.onChange}
              defaultValue={`${settings.shareport}`}
              icon="input"
              label="Sharing port (make sure this port is reachable)"
              s={6}
            />
          </Row>
          <Row s={12} className="input-field">
            <Input
              s={4}
              name="sharespace"
              onChange={this.onChange}
              label="Space reserved for shared files"
              defaultValue={settings.sharespace}
              icon="space"
            />
            <Col s={8}>
              <Slider
                onChange={v => this.onChange('sharespace', v)}
                step={1}
                value={settings.sharespace}
                min={1}
                max={1000}
              />
            </Col>
          </Row>
          <Row s={12}>
            <Input
              icon="share"
              s={12}
              label="Share key"
              value={`${settings.sharekey}-${settings.dbKey}-${settings.dbNonce}`}
            />
          </Row>
        </Card>
        <Card
          title="Media libraries"
          actions={[<Button key="new" onClick={() => this.librarySelect({})}><Icon left>add</Icon>Add new</Button>]}
        >
          <Collection>
            {listItems}
          </Collection>
          {this.state.create && <LibraryDialog
            onSave={this.onLibrarySave}
            onClose={this.onLibraryClose}
            editing={this.state.create}
          />}
        </Card>
        {deletingModal}
      </div>
    );
  }
}

export default Settings;

