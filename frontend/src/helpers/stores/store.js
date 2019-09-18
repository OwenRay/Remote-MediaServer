/**
 * Created by owenray on 7/2/2017.
 * this store should be used for any api calls except for settings
 */

import { combineReducers } from 'redux';
import { apiReducer as api } from 'redux-jsonapi';
import {createStore, applyMiddleware} from 'redux';
import { createApiMiddleware } from 'redux-jsonapi';
import { playQueue } from './playQueue';

const reducers = combineReducers({
  api,
  playQueue,
});

const apiMiddleware = createApiMiddleware('/api');

export default createStore(reducers, applyMiddleware(apiMiddleware));
