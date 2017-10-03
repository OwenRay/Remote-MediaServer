import { camelize } from 'humps';
import pluralize from 'pluralize';
import store from './apiStore';
import { apiActions } from 'redux-jsonapi';

function deserializeRelationships(resources = [], store) {
  return resources
    .map((resource) => deserializeRelationship(resource, store))
    .filter((resource) => !!resource);
}

async function deserializeRelationship(resource = {}, store) {
  const type = pluralize.singular(resource.type);
  const {api} = store.getState();
  if (api[camelize(type)] && api[camelize(type)][resource.id]) {
    return deserialize({ ...api[camelize(type)][resource.id], meta: { loaded: true } }, api);
  }
  console.log("QQQ", resource);
  return deserialize((await store.dispatch(apiActions.read(deserialize(resource)))).resources[0], api);
  //return deserialize({ ...resource, meta: { loaded: false } }, api);
}

function deserialize({ id, type, attributes, relationships, meta }, store) {
  let resource = { _type: type, _meta: meta };

  if (id) resource = { ...resource, id };

  if (attributes) {
    resource = Object.keys(attributes).reduce((resource, key) => {
      return { ...resource, [camelize(key)]: attributes[key] };
    }, resource);
  }

  if (relationships) {
    resource = Object.keys(relationships).reduce((resource, key) => {
      return {
        ...resource,
        [camelize(key)]: () => {
          if (Array.isArray(relationships[key].data)) {
            return deserializeRelationships(relationships[key].data, store);
          } else {
            return deserializeRelationship(relationships[key].data, store)
          }
        },
      };
    }, resource);
  }

  return resource;
}

require('redux-jsonapi/dist/').deserialize = deserialize ;

export default deserialize;
