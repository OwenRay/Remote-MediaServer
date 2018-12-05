/* global document */
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Switch } from 'react-router-dom';

// these two lines overwrite the serialization of redux-jsonapi
// eslint-disable-next-line
import serializer from "./helpers/stores/serialize";
// eslint-disable-next-line
import deserializer from "./helpers/stores/deserialize";


import App from './App';
import Cache from './helpers/Cache';

Cache.init();
require('./css/index.css');

ReactDOM.render(
  <BrowserRouter>
    <Switch>
    <App />
    </Switch>
  </BrowserRouter>,
  document.getElementById('root'),
);
// registerServiceWorker();
