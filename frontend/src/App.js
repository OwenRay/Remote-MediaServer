/* global $ */
import React, { Component } from 'react';
import { Flipper } from 'react-flip-toolkit';

import { Navbar, Icon, Table, Modal } from 'react-materialize';
import { Route, NavLink } from 'react-router-dom';
import { apiActions } from 'redux-jsonapi';
import Library from './routes/Library';
import Settings from './routes/Settings';
import Home from './routes/Home';
import Video from './routes/Video';
import store from './helpers/stores/settingsStore';
import Detail from './routes/Detail';
import ShortcutHelper from './helpers/ShortcutHelper';
import Api from './routes/Api';
import About from './routes/About';
import SocketIO from './helpers/SocketIO';
import LocalStorageIcon from './components/localStorage/LocalStorageIcon';
import LocalStorageRoute from './routes/LocalStorage';
import LocalStorage from './helpers/LocalStorage';


class App extends Component {
  constructor() {
    super();
    this.state = {};
    this.onShortcut = this.onShortcut.bind(this);
    this.toggleHelp = this.toggleHelp.bind(this);

    SocketIO.onMessage('toast', this.onToast);
  }

  componentWillMount() {
    store.subscribe(() => {
      if (!store.getState().api.setting) {
        return;
      }
      this.setState({ name: store.getState().api.setting[1].attributes.name });
    });
    store.dispatch(apiActions.read({ id: 1, _type: 'settings' }));

    ShortcutHelper.setOnSuccessfulShortcut(this.onShortcut);
    this.shortcuts = new ShortcutHelper()
      .add(ShortcutHelper.EVENT.HELP, this.toggleHelp);
  }

  componentWillUnmount() {
    this.shortcuts.off();
  }

  onToast(toastMessage) {
    window.Materialize.toast(toastMessage, 3000);
  }

  onShortcut(result) {
    if (!result) return;
    if (this.hideShortcutText) { clearTimeout(this.hideShortcutText); }
    this.setState({ shortcutText: result, showShortcutText: true });
    this.hideShortcutText = setTimeout(
      () => this.setState({ showShortcutText: false }),
      350,
    );
  }

  toggleHelp() {
    $('#help').modal(this.modalOpen ? 'close' : 'open');
    this.modalOpen = !this.modalOpen;
  }

  render() {
    return (
      <div className="App">
        <Navbar
          options={{ closeOnClick: true }}
          brand={<div><img alt="Remote MediaServer" src="/assets/img/logo_small.png" height={25} /> {this.state.name}</div>}
          right
        >
          <li>
            <NavLink to="/" exact>
              <Icon left>home</Icon>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/Library">
              <Icon left>video_library</Icon>
              Library
            </NavLink>
          </li>
          {LocalStorage.isSupported ?
            <li>
              <NavLink to="/LocalStorage" exact>
                <LocalStorageIcon />
                Offline
              </NavLink>
            </li>
          : ''}
          <li>
            <NavLink to="/Settings">
              <Icon left>settings</Icon>
              Settings
            </NavLink>
          </li>
          <li>
            <NavLink to="/About">
              <Icon left>help</Icon>
            </NavLink>
          </li>
        </Navbar>
        <Flipper
          flipKey={this.props.location.pathname + this.props.location.search}
        >
          <div id="scrollContainer">
            <Route path="/" component={Home} exact />
            <Route path="/Settings" component={Settings} />
            <Route path="/Api" component={Api} />
            <Route path="/About" component={About} />
            <Route path="/LocalStorage" component={LocalStorageRoute} />
          </div>
          <Route path="/Library" component={Library} exact />
          <Route path="/item/detail/:id" component={Detail} />
          <Route path="/item/view/:id" component={Video} />
        </Flipper>
        <div className={`shortcutText ${this.state.showShortcutText ? 'visible' : ''}`}>
          {this.state.shortcutText}
        </div>
        <Modal
          id="help"
          header="Keyboard Shortcuts"
        >
          <Table>
            <tbody>
              <tr>
                <td>Arrow keys</td>
                <td>Browse videos</td>
              </tr>
              <tr>
                <td>[space] or [enter]</td>
                <td>Start playing selected video</td>
              </tr>
              <tr>
                <td>P, K or [space]</td>
                <td>Toggle pause</td>
              </tr>
              <tr>
                <td>M</td>
                <td>Toggle mute</td>
              </tr>
              <tr>
                <td>F</td>
                <td>Toggle fullscreen</td>
              </tr>
              <tr>
                <td>Arrow up and down</td>
                <td>Change volume</td>
              </tr>
              <tr>
                <td>Arrow left and right, or J & L</td>
                <td>Seek 20 seconds</td>
              </tr>
            </tbody>
          </Table>
        </Modal>
      </div>
    );
  }
}

export default App;
