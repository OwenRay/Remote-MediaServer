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
        console.log(url);
        var urlParts = url.pathname.split("/");
        var type = urlParts[2];
        var singularType = pluralize.singular(type);
        response.setHeader("Content-Type", "text/json");

        var data;
        var query = querystring.parse(url.query);
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

        if (!isNaN(parseInt(urlParts[3]))) {
            data = Database.getById(singularType, parseInt(urlParts[3]));
        } else if (Object.keys(query).length>0) {
            data = Database.findByMatchFilters(singularType, query);
        }else{
            data = Database.getAll(singularType);
        }

        if(sort)
        {
            data = data.sort(function(a, b){
                if(a.attributes[sort]===undefined) {
                    console.log("undef", a.attributes[sort]);
                    return 1;
                }
                if(b.attributes[sort]===undefined) {
                    console.log("undef", b.attributes[sort]);
                    return -1;
                }
                if(a.attributes[sort].localeCompare)
                {
                    console.log("hier");
                    return a.attributes[sort].localeCompare(b.attributes[sort]);
                }
                console.log(a.attributes[sort], b.attributes[sort]);
                return a.attributes[sort]-b.attributes[sort];
            });
        }

        var result = {data:data, meta:{}};
        if(offset||limit)
        {
            result.meta.totalPages = Math.ceil(result.data.length/limit);
            result.data = result.data.splice(offset, limit);
        }

        var json = JSON.stringify(result);
        response.end(json);
        return true;
    }
}

module.exports = DatabaseApiHandler;