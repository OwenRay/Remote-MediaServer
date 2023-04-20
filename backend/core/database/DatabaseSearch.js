const Database = require('./Database');
// /
class DatabaseSearch {
  static query(
    singularType,
    {
      where, sort, distinct, join, relationConditions = [], limit, offset,
    },
  ) {
    let data;

    if (where && Object.keys(where).length > 0) {
      // find items with given filters
      data = Database.findByMatchFilters(singularType, where);
    } else {
      // get all items
      data = Database.getAll(singularType);
    }

    // parse sort params, example params: key:ASC,key2:DESC
    let sortArray = [];
    if (sort) {
      sortArray = sort.split(',').map((i) => i.split(':'));
    }
    const sortFunction = (a, b) => {
      // eslint-disable-next-line guard-for-in,no-restricted-syntax
      for (const key in sortArray) {
        const sortItem = sortArray[key][0];
        let direction = sortArray[key].length > 1 ? sortArray[key][1] : 'ASC';
        direction = direction === 'ASC' ? 1 : -1;
        if (a.attributes[sortItem] === undefined || a.attributes[sortItem] === null) {
          return 1;
        }
        if (b.attributes[sortItem] === undefined || b.attributes[sortItem] === null) {
          return -1;
        }
        if (a.attributes[sortItem].localeCompare) {
          if (a.attributes[sortItem].localeCompare(b.attributes[sortItem]) !== 0) {
            return a.attributes[sortItem].localeCompare(b.attributes[sortItem]) * direction;
          }
        }
        if (a.attributes[sortItem] - b.attributes[sortItem] !== 0) {
          return (a.attributes[sortItem] - b.attributes[sortItem] > 0 ? 1 : -1) * direction;
        }
      }
      return 0;
    };

    // add relationships
    if (join) {
      for (let key = 0; key < data.length; key += 1) {
        let meetsConditions = true;
        let relObject;
        const rel = data[key].relationships ? data[key].relationships[join] : null;
        if (rel) {
          relObject = Database.getById(join, rel.data.id);
        }

        if (relationConditions[join] !== undefined) {
          meetsConditions = Object.keys(relationConditions[join]).every((conditionKey) => {
            const what = relationConditions[join][conditionKey];
            if (!relObject) {
              return what !== 'true';
            }
            return `${relObject.attributes[conditionKey]}` === what;
          });
        }

        if (!meetsConditions) {
          data.splice(key, 1);
          key -= 1;
        }
      }
    }

    if (sort) {
      data = data.sort(sortFunction);
    }

    // make sure all the items have a unique "distinct" value
    const got = [];
    if (distinct) {
      data = data.filter((item) => {
        const distinctVal = item.attributes[distinct];
        if (got[distinctVal]) {
          return false;
        }
        got[distinctVal] = true;
        return true;
      });
    }
    const metadata = {};
    if (offset || limit) {
      metadata.totalPages = Math.ceil(data.length / limit);
      metadata.totalItems = data.length;
      data = data.splice(offset, limit);
    }

    const included = join ? DatabaseSearch.getRelationShips(join, data) : [];

    return { data, included, metadata };
  }

  static getRelationShips(join, items) {
    // get relationships
    const rels = {};

    for (let c = 0; c < items.length; c += 1) {
      const relation = items[c].relationships ? items[c].relationships[join] : null;
      if (relation) {
        if (!rels[relation.data.id]) {
          rels[relation.data.id] = Database.getById(join, relation.data.id);
        }
      }
    }

    return Object.values(rels);
  }
}

module.exports = DatabaseSearch;
