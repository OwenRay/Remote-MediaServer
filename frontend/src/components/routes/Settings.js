/**
 * Created by owenray on 6/30/2017.
 */
/* global $ */
import React, {Component} from 'react';
import {Tabs, Tab, Card, Input, Row, Button, Icon, Collection, CollectionItem, Modal} from 'react-materialize';
import store from "../../stores/settingsStore";
import { apiActions, deserialize} from 'redux-jsonapi';
import ServerFileBrowser from '../components/ServerFileBrowser';

class Settings extends Component {

  componentWillMount() {
    store.subscribe(this.change.bind(this));
    this.onChange = this.onChange.bind(this);
    this.change();
    this.librarySelect({});
  }

  /**
   * triggered when the settings model changes
   */
  change() {
    const api = store.getState().api;
    if(!api.setting)
    {
      return;
    }
    this.setState(
      {"settings":deserialize(api.setting[1], api)}
    );
  }

  /**
   * @param e
   * called when user types in field, applies typed value to state
   */
  onChange(e) {
    console.log(e.target.value);
    const o = this.state;
    o.settings[e.target.name] = e.target.value;
    this.setState(o);
  }

  librarySelect(lib) {
    this.setState({"create":lib});
    console.log(lib);
  }

  componentDidUpdate() {
    $('.modal').modal('open');
  }

  removeLib(lib, confirm) {
    if(confirm===undefined) {
      this.setState({removing: lib});
    }else{
      $('.modal').modal('close');
      if(confirm) {
        //store.dispatch(apiActions.remove(lib));
        this.state.settings.libraries.splice(this.state.settings.libraries.indexOf(lib), 1);
        this.onSubmit();
      }
      this.setState({removing: null});
    }
  }

  /**
   * save settings, called when submit is clicked
   */
  onSubmit() {
    var o = this.state.settings;
    o._type = "settings";
    store.dispatch(apiActions.write(o));
  }

  render() {
    if(!this.state||!this.state.settings) {
      return (<p>Loading</p>);
    }

    var listItems = this.state.settings.libraries.map((lib)=>
        <CollectionItem onClick={()=>{this.librarySelect(lib)}} key={lib.uuid}>
          {lib.name}
          <Button icon="delete" onClick={()=>this.removeLib(lib)}/>
        </CollectionItem>
      );

    if(this.state.removing) {
      var deletingModal =
          <Modal
            id="deleteModal"
            actions={[
              <Button onClick={()=>this.removeLib(this.state.removing, false)} modal="close">close</Button>,
              <Button onClick={()=>this.removeLib(this.state.removing, true)} modal="confirm">confirm</Button>,
            ]}>
            <h4>Deleting "{this.state.removing.name}"</h4>
            Are you sure your want to delete "{this.state.removing.name}"?
          </Modal>;
    }

    if(this.state.create) {
      console.log("create");
      var createModal =
        <Modal
            id="createModal"
            actions={[
              <Button modal="close">close</Button>,
              <Button onClick={()=>this.createSave(true)} modal="confirm">confirm</Button>,
            ]}>
          <h4>Add library</h4>
          <Row>
            <Input value={this.state.type} name="type" onchange={this.onChange} label="Type" s={12} type="select">
              <option value="folder">Unspecified</option>
              <option value="tv">TV Shows</option>
              <option value="movie">Movies</option>
              <option value="library_music">Music</option>
            </Input>
            <Input onChange={this.onChange} name="name" s={12} label="Name"/>
            <ServerFileBrowser onChange={this.onChange} label="Directory"/>
          </Row>
        {/*{{#server-file-browser label="Library folder" value=selectedLibrary.folder}}{{/server-file-browser}} */}
        </Modal>
    }



    return (
      <Tabs>
        <Tab title="Server settings" active>
          <Card
            title="Server settings"
            actions={[<Button key="save" onClick={this.onSubmit.bind(this)}><Icon left>save</Icon>Save</Button>]}>
            <Row>
              <Input
                name="name"
                onChange={this.onChange.bind(this)}
                value={this.state.settings.name}
                label='Server name'
                s={12}/>
              <Input
                name="port"
                onChange={this.onChange.bind(this)}
                value={this.state.settings.port+""}
                defaultValue=""
                label='Port'
                s={12}/>
            </Row>
          </Card>
        </Tab>
        <Tab title="Media library">
          <Card
            title="Media library"
            actions={[<Button key="new" onClick={()=>this.librarySelect({})}><Icon left>add</Icon>Add new</Button>]}>
            <Collection>
              {listItems}
            </Collection>
          </Card>
          {deletingModal}
          {createModal}
        </Tab>
      </Tabs>
    );
  }
}

export default Settings;

