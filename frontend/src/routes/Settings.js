/**
 * Created by owenray on 6/30/2017.
 */
/* global $ */
import React, {Component} from 'react';
import {Tabs, Tab, Card, Input, Row, Button, Icon, Collection, CollectionItem, Modal} from 'react-materialize';
import store from "../helpers/stores/settingsStore";
import {apiActions, deserialize} from 'redux-jsonapi';
import LibraryDialog from "../components/LibraryDialog";

class Settings extends Component {

  componentDidMount() {
    store.subscribe(this.change.bind(this));
    this.onChange = this.onChange.bind(this);
    this.setState({"activeTab": 0});
    this.change();
  }

  /**
   * triggered when the settings model changes
   */
  change() {
    const {api} = store.getState();
    if (!api.setting) {
      return;
    }
    this.setState(
      {
        settings: deserialize(api.setting[1], store)
      }
    );
  }

  /**
   * @param e
   * called when user types in field, applies typed value to state
   */
  onChange(e) {
    const {settings} = this.state;
    settings[e.target.name] = e.target.value;
    this.setState({settings});
  }

  /**
   * @param lib
   * Called when creating a new library or when clicking an existing one
   */
  librarySelect(lib) {
    this.setState({"create": lib});
  }

  /**
   * @param lib library object
   * @param confirm confirmed via dialog?
   *
   * Remove library
   */
  removeLib(lib, confirm) {
    if (confirm === undefined) {
      this.setState({removing: lib});
    } else {
      $('#deleteModal').modal('close');
      if (confirm) {
        this.state.settings.libraries.splice(this.state.settings.libraries.indexOf(lib), 1);
        this.onSubmit();
      }
      this.setState({removing: null});
    }
  }

  /**
   * Make sure the deletmodal opens when it's rendered
   */
  componentDidUpdate() {
    $("#deleteModal").modal({
      'complete': () => {
        console.log("hier?");
        this.setState({removing: null});
      }
    })
      .modal('open');
  }

  /**
   * save settings, called when submit is clicked
   */
  onSubmit() {
    const o = this.state.settings;
    o._type = "settings";
    store.dispatch(apiActions.write(o));
  }

  /**
   * called the library creating dialog wants to persist the edited data
   * @param lib
   */
  onLibrarySave(lib) {
    const o = this.state.settings;
    let existing = false;
    for(let key in o.libraries) {
      if(lib.uuid===o.libraries[key].uuid) {
        o.libraries[key] = lib;
        existing = true;
        break;
      }
    }
    if(!existing) {
      o.libraries.push(lib);
    }
    this.setState({"settings": o});
    this.onSubmit();
  }

  /**
   * Gets called when the library dialog closes
   */
  onLibraryClose() {
    this.setState({"create": null});
  }

  onTabChange(tab) {
    console.log("ontabchange", tab);
    this.setState({activeTab: parseInt(tab, 10) % 10});
  }

  render() {
    if (!this.state || !this.state.settings) {
      return (<p>Loading</p>);
    }

    const listItems = this.state.settings.libraries.map((lib) =>
      <CollectionItem onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        this.librarySelect(lib)
      }} key={"key" + lib.uuid}>
        {lib.name}
        <Button icon="delete" onClick={(e) => {
          e.stopPropagation();
          this.removeLib(lib);
        }}/>
      </CollectionItem>
    );

    let deletingModal;
    if (this.state.removing) {
      deletingModal =
        <Modal
          id="deleteModal"
          actions={[
            <Button modal="close">close</Button>,
            <Button onClick={() => this.removeLib(this.state.removing, true)} modal="confirm">confirm</Button>,
          ]}>
          <h4>Deleting "{this.state.removing.name}"</h4>
          Are you sure your want to delete "{this.state.removing.name}"?
        </Modal>;
    }

    return (
      <div>
        <Tabs
          key="settingstabs"
          onChange={this.onTabChange.bind(this)}
          className="tabs-fixed-width">
          <Tab
            key="1"
            active={this.state.activeTab === 0}
            title="Server settings">
          </Tab>
          <Tab
            key="2"
            active={this.state.activeTab === 1}
            title="Media library">
          </Tab>
        </Tabs>
        {this.state.activeTab === 0 ?
          <Card
            title="Server settings"
            actions={[<Button key="save" onClick={this.onSubmit.bind(this)}><Icon left>save</Icon>Save</Button>]}>
            <Row>
              <Input
                name="name"
                onChange={this.onChange.bind(this)}
                defaultValue={this.state.settings.name}
                label='Server name'
                s={12}/>
              <Input
                name="port"
                onChange={this.onChange.bind(this)}
                defaultValue={this.state.settings.port + ""}
                label='Port'
                s={12}/>
            </Row>
          </Card> : ""}
        {this.state.activeTab === 1 ?
          <Card
            title="Media library"
            actions={[<Button key="new" onClick={() => this.librarySelect({})}><Icon left>add</Icon>Add new</Button>]}>
            <Collection>
              {listItems}
            </Collection>
          </Card> : ""}

        {deletingModal}
        {this.state.create && <LibraryDialog
          onSave={this.onLibrarySave.bind(this)}
          onClose={this.onLibraryClose.bind(this)}
          editing={this.state.create}
        />}
      </div>
    );
  }
}

export default Settings;

