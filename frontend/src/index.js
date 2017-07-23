import React from 'react';
import ReactDOM from 'react-dom';
//import './css/index.scss';
import {BrowserRouter} from 'react-router-dom';

import App from './App';
require('./css/index.css');
//import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById('root')
);
//registerServiceWorker();
