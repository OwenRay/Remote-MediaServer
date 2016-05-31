/**
 * Created by Owen on 14-4-2016.
 */
"use strict";;
var Database = require("../../Database");
var pluralize = require('pluralize');
var IApiHandler = require("./IApiHandler");;
var querystring = require("querystring");

class DatabaseApiHandler extends IApiHandler
{
    handle(request, response, url) {

        var query = querystring.parse(url.query);
        var urlParts = url.pathname.split("/");
        var type = urlParts[2];
        var singularType = pluralize.singular(type);

        switch(request.method)
        {
            case "PATCH":
            case "POST":
            case "PUT":
                this.handlePost(request, response, singularType);
                break;
            case "GET":
                this.handleGet(response, query, singularType, parseInt(urlParts[3]));
        }
    }

    handlePost(request, response, singularType) {
        var item;
        var body = [];

        request.on('data', function(chunk) {
            console.log(chunk);
            body.push(chunk);
        }).on('end', function() {
            console.log(`${body}`);
            body = JSON.parse(`${body}`);
            var i = body.data;
            var item = Database.getById(singularType, i.id);

            if(item)
            {
                for(var key in i.attributes)
                {
                    item.attributes[key] = i.attributes[key];
                }
                item.relationships = i.relationships;
                this.respond(response, Database.update(singularType, item));
                return;
            }

            this.respond(response, Database.setObject(singularType, i.attributes));
        }.bind(this));
    }

    handleGet(response, query, singularType, itemId)
    {
        response.setHeader("Content-Type", "text/json");

        var data;
        var offset = 0;
        var limit = 0;
        var sort =  null;

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
        if(query["sort"])
        {
            sort = query["sort"];
            delete query["sort"];
        }

        for(var key in query)
        {
            if(!query[key])
            {
                delete query[key];
            }
        }

        if (!isNaN(itemId)) {
            data = Database.getById(singularType, itemId);
        } else if (Object.keys(query).length>0) {
            data = Database.findByMatchFilters(singularType, query);
        }else{
            data = Database.getAll(singularType);
        }

        if(sort)
        {
            data = data.sort(function(a, b){
                if(a.attributes[sort]===undefined)
                {
                    return 1;
                }
                if(b.attributes[sort]===undefined)
                {
                    return -1;
                }
                if(a.attributes[sort].localeCompare)
                {
                    return a.attributes[sort].localeCompare(b.attributes[sort]);
                }
                return a.attributes[sort]-b.attributes[sort];
            });
        }

        var metadata = {};
        if(offset||limit)
        {
            metadata.totalPages = Math.ceil(data.length/limit);
            data = data.splice(offset, limit);
        }

        this.respond(response, data, metadata)
        return true;
    }

    respond(response, data, metadata)
    {
        var json = JSON.stringify({data:data, meta:metadata});
        response.end(json);
    }
}

module.exports = DatabaseApiHandler;