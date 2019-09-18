const humps = require('humps');

const { decamelize } = humps;
humps.decamelize = (a, b = {}) => {
  b.separator = '-';
  return decamelize(a, b);
};
const o = { separator: '-' };


function serializeRelationship({ id, _type } = {}) {
  return { id, type: _type };
}

function serializeRelationships(resources = []) {
  return resources.map(resource => serializeRelationship(resource));
}

function serialize({
  id, _type, _meta, ...otherAttributes
}) {
  let resrc = {};

  if (id) resrc = { ...resrc, id };
  resrc = { ...resrc, type: _type };

  resrc = Object.keys(otherAttributes).reduce((resource, key) => {
    if (typeof otherAttributes[key] === 'function') {
      const data = otherAttributes[key].call();

      if (Array.isArray(data)) {
        return {
          ...resource,
          relationships: {
            ...resource.relationships,
            [decamelize(key, o)]: {
              data: serializeRelationships(data),
            },
          },
        };
      }

      return {
        ...resource,
        relationships: {
          ...resource.relationships,
          [decamelize(key, o)]: {
            data: data && serializeRelationship(data),
          },
        },
      };
    }

    if (key[0] === '_') return resource;

    return {
      ...resource,
      attributes: {
        ...resource.attributes,
        [decamelize(key, o)]: otherAttributes[key],
      },
    };
  }, resrc);

  if (_meta) resrc = { ...resrc, meta: _meta };
  return resrc;
}

require('redux-jsonapi/dist/serializers').serialize = serialize;

export default serialize;
