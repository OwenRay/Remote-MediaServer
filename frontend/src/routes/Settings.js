/* eslint-disable no-underscore-dangle */
/**
 * Created by owenray on 6/30/2017.
 */
/* global $ */
import React, { Component } from 'react';
import { Card, Row, Col, Button, Select, Checkbox, Icon, Collection, TextInput, CollectionItem, Modal } from 'react-materialize';
import { apiActions, deserialize } from 'redux-jsonapi';
import { Flipped } from 'react-flip-toolkit';
import Slider from 'rc-slider';
import store from '../helpers/stores/settingsStore';
import LibraryDialog from '../components/LibraryDialog';

let availableModules = [];
const moduleDescription = {
  debug: 'Adds some basic debugging tools',
  ffmpeg: 'For playing and encoding videos',
  sharing: 'Allows you to share libraries p2p end-to-end encrypted',
  tmdb: 'Use TheMovieDB to find media info',
  filename: 'Parses filenames to information like title and year',
  ssl: 'allows you to configure https through an rms subdomain',
  socketio: 'enables realtime notifications',
};

class Settings extends Component {
  constructor() {
    super();
    this.state = { activeTab: 0, availableModules };
    if (!availableModules.length) {
      $.get('/api/modules', (result) => {
        availableModules = result;
        this.setState({ availableModules });
      });
    }
  }

  componentWillMount() {
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
    window.M.toast({ html: 'Settings saved', displayLength: 3000 });
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
    const { target } = e;
    const { settings } = this.state
    if (target.type === 'checkbox') value = target.checked;
    if (target.type === 'checkbox' && Array.isArray(settings[target.name])) {
      const i = settings[target.name].indexOf(target.value);
      if (i === -1) settings[target.name].push(target.value);
      else settings[target.name].splice(i, 1);
    } else {
      settings[target ? target.name : e] = value;
    }
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
    console.log(Select);
    if (!this.state || !this.state.settings) {
      return (<p>Loading</p>);
    }

    const { settings } = this.state;

    const listItems = settings.libraries.map(lib => (
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
          onClick={(e) => {
            e.stopPropagation();
            this.removeLib(lib);
          }}
        >
          <Icon>delete</Icon>
        </Button>
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
        <Button
          className="bottom-right-fab"
          key="save"
          floating
          onClick={this.onSubmit}
        >
          <Icon>save</Icon>
        </Button>
        <Flipped flipId="page">
          <div className={settings.advanced ? 'advanced' : ''}>
            <Row style={{ margin: 20, float: 'right' }}>
              <Checkbox
                id="checkbox"
                type="checkbox"
                checked={settings.advanced}
                onChange={this.onChange}
                name="advanced"
                label="Show advanced"
                value="advanced"
              />
            </Row>
            <Card
              title="Server settings"
            >
              <Row>
                <TextInput
                  name="name"
                  onChange={this.onChange}
                  value={settings.name}
                  icon="label"
                  label="Server name"
                  s={12}
                />
              </Row>
              <Row className="advancedItem">
                <TextInput
                  name="port"
                  onChange={this.onChange}
                  value={`${settings.port}`}
                  icon="input"
                  label="Port"
                  s={12}
                />
              </Row>
              <Row className="advancedItem">
                <Select
                  s={12}
                  name="filewatcher"
                  onChange={this.onChange}
                  label="File watcher"
                  value={settings.filewatcher}
                  icon={<Icon>remove_red_eye</Icon>}
                >
                  <option value="native">Use native filesystem events</option>
                  <option value="polling">Alternative (Polling)</option>
                </Select>
              </Row>
              <Row>
                <Checkbox
                  id="startscan"
                  type="checkbox"
                  name="startscan"
                  onChange={this.onChange}
                  label="Full rescan on start"
                  checked={settings.startscan}
                  value="startscan"
                />
              </Row>
            </Card>

            {settings.modules.indexOf('ssl') !== -1 ? (
              <Card title="SSL">
                <Row>
                  <TextInput
                    name="ssldomain"
                    onChange={this.onChange}
                    value={`${settings.ssldomain || ''}`}
                    icon="enhanced_encryption"
                    label="SSL Subdomain name (yourname.theremote.io)"
                    s={12}
                  />
                </Row>
                <Row>
                  <TextInput
                    name="sslport"
                    onChange={this.onChange}
                    value={`${settings.sslport || ''}`}
                    icon="input"
                    label="SSL port"
                    s={12}
                  />
                </Row>
                <Row>
                  <TextInput
                    name="sslemail"
                    onChange={this.onChange}
                    value={`${settings.sslemail || ''}`}
                    icon="email"
                    label="Email address (necessary for certificate registration)"
                    s={12}
                  />
                </Row>
                <Row>
                  <Checkbox
                    id="sslredirect"
                    type="checkbox"
                    name="sslredirect"
                    onChange={this.onChange}
                    checked={settings.sslredirect}
                    value="sslredirect"
                    label="Automatically redirect to https"
                    s={12}
                  />
                </Row>
              </Card>
            ) : ''}
            {settings.modules.indexOf('sharing') !== -1 ?
              <Card
                title="Share settings"
              >
                <Row className="advancedItem">
                  <TextInput
                    name="sharehost"
                    onChange={this.onChange}
                    value={`${settings.sharehost}`}
                    icon="input"
                    label="Sharing host (empty for autodetect)"
                    s={6}
                  />
                  <TextInput
                    name="shareport"
                    onChange={this.onChange}
                    value={`${settings.shareport}`}
                    icon="input"
                    label="Sharing port (make sure this port is reachable)"
                    s={6}
                  />
                </Row>
                <Row s={12} className="input-field">
                  <TextInput
                    s={4}
                    name="sharespace"
                    onChange={this.onChange}
                    label="Space reserved for shared files"
                    value={`${settings.sharespace}`}
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
                  <TextInput
                    icon="share"
                    s={12}
                    label="Share key"
                    value={`${settings.sharekey}-${settings.dbKey}-${settings.dbNonce}`}
                    readOnly
                  />
                </Row>
              </Card>
              : ''}
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
            <Card title="Modules">
              <Row>Changing these requires a restart of the mediaserver</Row>
              {this.state.availableModules
                .map(i => (
                  <Row key={i}>
                    <Checkbox
                      label={`${i} - ${moduleDescription[i]}`}
                      value={i}
                      checked={settings.modules.indexOf(i) !== -1}
                      onChange={this.onChange}
                      type="checkbox"
                      name="modules"
                      id={i}
                    />
                  </Row>
                ))
              }
            </Card>
            {deletingModal}
          </div>
        </Flipped>
      </div>
    );
  }
}

export default Settings;

