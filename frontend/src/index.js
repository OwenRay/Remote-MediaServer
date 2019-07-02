/* global document,navigator,window */
import React from 'react';
import ReactDOM from 'react-dom';
import history from './helpers/history';
import { Router, Switch } from 'react-router-dom';
// these two lines overwrite the serialization of redux-jsonapi
// eslint-disable-next-line
import serializer from "./helpers/stores/serialize";
// eslint-disable-next-line
import deserializer from "./helpers/stores/deserialize";

import App from './App';

require('./css/index.css');


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((registration) => {
      registration.update();
    });
  });
}

ReactDOM.render(
  <Router history={history}>
    <Switch>
      <App />
    </Switch>
  </Router>,
  document.getElementById('root'),
);
// registerServiceWorker();
