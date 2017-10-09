import React from 'react';
import ReactDOM from 'react-dom';

// these two lines overwrite the serialization of redux-jsonapi
// noinspection ES6UnusedImports
import serializer from "./stores/serialize";
// noinspection ES6UnusedImports
import deserializer from "./stores/deserialize";

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
