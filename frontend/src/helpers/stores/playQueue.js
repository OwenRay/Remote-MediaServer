/* global $ */
import { apiActions, deserialize } from 'redux-jsonapi';
import store from './store';

export const ACTION_ENQUEUE = 'enqueue';
export const ACTION_CLEAR = 'clear';
export const ACTION_OVERWRITE = 'overwrite';
export const ACTION_INSERT = 'insert';
export const ACTION_SKIP = 'skip';
export const HIDE_PLAYER = 'hide';

const defaultValue = {
  offset: 0,
  items: [],
  playerVisible: false,
};


const playQueue = (state = defaultValue, { type, data }) => {
  console.log('reducer!!!', type, data);
  switch (type) {
    case ACTION_ENQUEUE:
      state.push(data);
      break;
    case ACTION_CLEAR:
      state = [];
      break;
    case ACTION_OVERWRITE:
      state = { ...state, ...data };
      break;
    case ACTION_SKIP:
      state.offset += data;
      if (state.offset < 0) state.offset = 0;
      if (state.offset >= state.items.length) state.offset = state.offset.length - 1;
      break;
    case HIDE_PLAYER:
      state.playerVisible = false;
      break;
    case ACTION_INSERT:
      state.items.splice(state.offset, 0, data);
      state.playerVisible = true;
      break;
    default: return state;
  }

  state.playing = state.offset <= state.items.length ? state.items[state.offset] : null;

  return { ...state };
};


async function prepareForPlayback(item) {
  if (item.playPosition) item.fetchedPlayPosition = await item.playPosition();
  const mediaContent = await $.getJSON(`/api/mediacontent/${item.id}`);
  if (mediaContent.subtitles.length) {
    mediaContent.subtitles.push({ value: '', label: 'Disable' });
  }
  item.mediaContent = mediaContent;
}


const playQueueActions = dispatch => ({
  skip: (offset) => {
    dispatch({ type: ACTION_SKIP, data: offset });
  },

  insertAtCurrentOffset: async (item) => {
    await prepareForPlayback(item);
    dispatch({ type: ACTION_INSERT, data: item });
  },

  hidePlayer: () => {
    dispatch({ type: HIDE_PLAYER });
  },

  insertAtCurrentOffsetById: async (id) => {
    const request = await store.dispatch(apiActions.read({ _type: 'media-items', id }));
    const item = deserialize(request.resources[0], store);
    await prepareForPlayback(item);
    dispatch({ type: ACTION_INSERT, data: item });
    if (item.mediaType !== 'tv') return;
    if (!item.externalId) return;

    // fetch and queue other episodes if available
    const readAction = apiActions.read(
      { _type: 'media-items' },
      {
        params:
          {
            'external-id': item.externalId,
            sort: 'season,episode',
            join: 'play-position',
            extra: 'false',
          },
      },
    );
    const episodes = await store.dispatch(readAction);
    const offset = episodes.resources.findIndex(e => e.id === item.id);
    await Promise.all(episodes.resources.map(e => prepareForPlayback(e)));
    dispatch({ type: ACTION_OVERWRITE, data: { offset, items: episodes.resources } });
  },
});

export { playQueue, playQueueActions };
