/* global $ */
import { apiActions, deserialize } from 'redux-jsonapi';
import store from './store';
import history from '../../helpers/history';

export const ACTION_ENQUEUE = 'enqueue';
export const ACTION_CLEAR = 'clear';
export const ACTION_OVERWRITE = 'overwrite';
export const ACTION_INSERT = 'insert';
export const ACTION_SKIP = 'skip';
export const HIDE_PLAYER = 'hide';
export const LOADING = 'loading';

const defaultValue = {
  offset: 0,
  items: [],
  playerVisible: false,
};


const playQueue = (state = defaultValue, { type, data }) => {
  switch (type) {
    case ACTION_ENQUEUE:
      state.push(data);
      state.loading = false;
      break;
    case ACTION_CLEAR:
      state = [];
      state.playerVisible = false;
      state.loading = false;
      break;
    case ACTION_OVERWRITE:
      state = { ...state, ...data };
      state.loading = false;
      break;
    case ACTION_SKIP:
      state.offset += data;
      if (state.offset < 0) state.offset = 0;
      if (state.offset >= state.items.length) state.offset = state.offset.length - 1;
      break;
    case HIDE_PLAYER:
      state.playerVisible = false;
      state.loading = false;
      break;
    case LOADING:
      state.loading = data;
      state.playerVisible = true;
      break;
    case ACTION_INSERT:
      state.items.splice(state.offset, 0, data);
      state.playerVisible = true;
      state.loading = false;
      break;
    default: return state;
  }

  state.playing = state.offset <= state.items.length ? state.items[state.offset] : null;
  state.hasNext = state.offset < state.items.length - 1;
  state.hasPrev = state.offset > 0;

  if (state.playing && state.playerVisible) {
    const url = `/item/play/${state.playing.id}`;
    if (window.location.pathname !== url) history.push(url);
  }

  return { ...state };
};


async function prepareForPlayback(item) {
  if (item.attributes) item = deserialize(item, store);

  if (item.playPosition) item.fetchedPlayPosition = await item.playPosition();
  const mediaContent = await $.getJSON(`/api/mediacontent/${item.id}`);
  if (mediaContent.subtitles.length) {
    mediaContent.subtitles.push({ value: '', label: 'Disable' });
  }
  item.mediaContent = mediaContent;
  return item;
}

async function populateQueue(item, dispatch) {
  if (item.mediaType !== 'tv') return;
  if (!item.externalId) return;

  // fetch and queue other episodes if available
  const readAction = apiActions.read(
    { _type: 'media-items' },
    {
      params:
        {
          'external-id': item.externalId,
          sort: 'season:ASC,episode:ASC',
          join: 'play-position',
          extra: 'false',
        },
    },
  );
  const episodes = await store.dispatch(readAction);
  const offset = episodes.resources.findIndex(e => e.id === item.id);
  const items = await Promise.all(episodes.resources
    .filter(e => e.type === 'media-item')
    .map(e => prepareForPlayback(e)));
  dispatch({ type: ACTION_OVERWRITE, data: { offset, items } });
}

const playQueueActions = dispatch => ({
  skip: (offset) => {
    dispatch({ type: ACTION_SKIP, data: offset });
  },

  insertAtCurrentOffset: async (item) => {
    dispatch({ type: LOADING, data: item.id });
    item = await prepareForPlayback(item);
    dispatch({ type: ACTION_INSERT, data: item });
    populateQueue(item, dispatch);
    return item;
  },

  hidePlayer: () => {
    dispatch({ type: HIDE_PLAYER });
  },

  insertAtCurrentOffsetById: async (id) => {
    dispatch({ type: LOADING, data: id });
    const request = await store.dispatch(apiActions.read({ _type: 'media-items', id }));
    const item = deserialize(request.resources[0], store);
    await prepareForPlayback(item);
    dispatch({ type: ACTION_INSERT, data: item });
    populateQueue(item, dispatch);
  },
});

export { playQueue, playQueueActions };
