import React from 'react';
import ReactDOM from 'react-dom';

// these two lines overwrite the serialization of redux-jsonapi
// eslint-disable-next-line
import serializer from "./helpers/stores/serialize";
// eslint-disable-next-line
import deserializer from "./helpers/stores/deserialize";

import {BrowserRouter} from 'react-router-dom';

import App from './App';
require('./css/index.css');

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById('root')
);
//registerServiceWorker();
