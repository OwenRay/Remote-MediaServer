/**
 * Created by Owen on 14-4-2016.
 */
"use strict";
const Database = require("../../Database");
const pluralize = require('pluralize');
const RequestHandler = require("../RequestHandler");
const httpServer = require("../../HttpServer");

class DatabaseApiHandler extends RequestHandler
{
    handleRequest() {
        const urlParts = this.path.split("/");
        const type = urlParts[2];
        const singularType = pluralize.singular(type);

        switch(this.request.method)
        {
            case "PATCH":
            case "POST":
            case "PUT":
                this.handlePost(singularType);
                return new Promise(resolve=>{
                    this.resolve = resolve;
                });
            case "GET":
                this.handleGet(this.context.query, singularType, this.context.params.id);
                break;
        }
    }

    handlePost(singularType) {
        let body = [];

        this.context.req.on('data', chunk => {
            body.push(chunk);
        }).on('end', ()=>{
            body = JSON.parse(`${body}`);
            const i = body.data;
            const item = Database.getById(singularType, i.id);

            if(item)
            {
                for(let key in i.attributes)
                {
                    item.attributes[key] = i.attributes[key];
                }
                item.relationships = i.relationships;
                this.respond(Database.update(singularType, item));
                return;
            }

            this.respond(Database.setObject(singularType, i.attributes));
        });
    }

    handleGet(query, singularType, itemId)
    {
        this.response.header["Content-Type"] = "text/json";

        let data;
        let offset = 0;
        let limit = 0;
        let sort = null;
        let distinct = null;
        let join = null;
        const relationConditions = {};

        //parse all the query items
        if(query['page[limit]'])
        {
            limit = parseInt(query['page[limit]']);
            delete query['page[limit]'];
        }
        if(query['page[offset]'])
        {
            offset = parseInt(query['page[offset]']);
            delete query['page[offset]'];
        }
        if(query.sort)
        {
            sort = query.sort;
            delete query.sort;
        }
        if(query.distinct)
        {
            distinct = query.distinct;
            delete query.distinct;
        }
        if(query.join)
        {
            join = query.join;
            delete query.join;
        }

        //all the query items left become "where conditions"
        for(let key in query)
        {
            if(key.indexOf(".")!==-1) {
                const s =key.split(".");
                if(!relationConditions[s[0]]) {
                    relationConditions[s[0]] = {};
                }
                relationConditions[s[0]][s[1]] = query[key];
                delete query[key];

            }
            if(!query[key])
            {
                delete query[key];
            }
        }


        if (!isNaN(itemId)) {
            //find single item
            data = Database.getById(singularType, itemId);
        } else if (Object.keys(query).length>0) {
            //find items with given filters
            data = Database.findByMatchFilters(singularType, query);
        }else{
            //get all items
            data = Database.getAll(singularType);
        }

        //parse sort params, example params: key:ASC,key2:DESC
        let sort_array = [];
        if(sort)
        {
            sort_array = sort.split(",");
            for(let key in sort_array) {
                sort_array[key] = sort_array[key].split(":");
            }
        }
        const sortFunction = function(a, b) {
            for (let key in sort_array) {
                const sort = sort_array[key][0];
                let direction = sort_array[key].length > 1 ? sort_array[key][1] : "ASC";
                direction = direction === "ASC" ? 1 : -1;
                if (a.attributes[sort] === undefined || a.attributes[sort] === null) {
                    return 1;
                }
                if (b.attributes[sort] === undefined || b.attributes[sort] === null) {
                    return -1;
                }
                if (a.attributes[sort].localeCompare) {
                    if (a.attributes[sort].localeCompare(b.attributes[sort]) !== 0) {
                        return a.attributes[sort].localeCompare(b.attributes[sort]) * direction;
                    }
                }
                if (a.attributes[sort] - b.attributes[sort] !== 0) {
                    return (a.attributes[sort] - b.attributes[sort] > 0 ? 1 : -1) * direction;
                }
            }
            return 0;
        };




        //add relationships
        let included = [];
        if(join)
        {
            for(let key = 0; key<data.length; key++)
            {
                let meetsConditions = true;
                let relObject;
                const rel = data[key].relationships?data[key].relationships[join]:null;
                if(rel) {
                    relObject = Database.getById(join, rel.data.id);
                }

                if(relationConditions[join]!==undefined) {
                    for (let what in relationConditions[join]) {
                        if(!relObject) {
                            if(relationConditions[join][what]==="true") {
                                meetsConditions = false;
                                break;
                            }
                        }else if (relObject.attributes[what] + "" !== relationConditions[join][what]) {
                            meetsConditions = false;
                            break;
                        }
                    }
                }

                if(!meetsConditions) {
                    data.splice(key, 1);
                    key--;
                }
            }
        }

        //make sure all the items have a unique "distinct" value
        //and get relationships
        const rels = {};
        const got = [];
        if(distinct) {
            for (let c = 0; c < data.length; c++) {
                const val = data[c].attributes[distinct];
                if (got[val] !== undefined) {
                    const score = sortFunction(data[c], got[val]);
                    if (score > 0) {
                        data.splice(c, 1);
                        c--;
                        continue;
                    } else {
                        data.splice(data.indexOf(got[val]), 1);
                    }
                    c--;
                }
                got[val] = data[c];
            }
        }

        if(sort) {
            data = data.sort(sortFunction);
        }

        //build return data
        const metadata = {};
        if(offset||limit)
        {
            metadata.totalPages = Math.ceil(data.length/limit);
            metadata.totalItems = data.length;
            data = data.splice(offset, limit);
        }

        if(join) {
            for (let c = 0; c < data.length; c++) {
                const rel = data[c].relationships ? data[c].relationships[join] : null;
                if (rel) {
                    if (!rels[rel.data.id]) {
                        rels[rel.data.id] = Database.getById(join, rel.data.id);
                    }
                }
            }
        }
        included = Object.values(rels);

        this.respond(data, metadata, included);
        return true;
    }

    respond(data, metadata, included)
    {
        const obj = {};
        obj.data = data;
        obj.meta = metadata;
        obj.included = included;
        this.context.body = obj;
        if(this.resolve) {
            this.resolve();
        }

    }
}

httpServer.registerRoute("all", "/api/media-items", DatabaseApiHandler);
httpServer.registerRoute("all", "/api/media-items/:id", DatabaseApiHandler);
httpServer.registerRoute("all", "/api/media-item/:id", DatabaseApiHandler);
httpServer.registerRoute("all", "/api/play-positions", DatabaseApiHandler);
httpServer.registerRoute("all", "/api/play-positions/:id", DatabaseApiHandler);

module.exports = DatabaseApiHandler;
