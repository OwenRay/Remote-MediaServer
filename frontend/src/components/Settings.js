/**
 * Created by o_ray on 7/1/2017.
 */
/**
 * Created by owenray on 6/30/2017.
 */
import React, {Component} from 'react';
import {Tabs, Tab, Card, Input, Row, Button, Icon} from 'react-materialize';
import store from "../stores/settingsStore";
import { apiActions, deserialize} from 'redux-jsonapi';

class Settings extends Component {

  componentWillMount() {
    store.subscribe(this.change.bind(this));
    this.change();
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
    const o = this.state;
    o.settings[e.target.name] = e.target.value;
    this.setState(o);
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

    return (
      <Tabs>
        <Tab title="Server settings" active>
          <Card
            title="Server settings"
            actions={[<Button key="a" onClick={this.onSubmit.bind(this)}><Icon left>save</Icon>Save</Button>]}>
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
        </Tab>
      </Tabs>
    );
  }
}

export default Settings;

