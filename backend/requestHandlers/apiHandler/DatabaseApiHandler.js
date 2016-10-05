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
        console.log("r", request.method, url);

        switch(request.method)
        {
            case "PATCH":
            case "POST":
            case "PUT":
                this.handlePost(request, response, singularType);
                break;
            case "GET":
                this.handleGet(response, query, singularType, parseInt(urlParts[3]));
                break;
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
        var distinct = null;

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
        if(query["distinct"])
        {
            distinct = query["distinct"];
            delete query["distinct"];
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


        if(distinct)
        {
            var got = [];
            for(var c = 0; c<data.length; c++) {
                var val = data[c].attributes[distinct];
                if(got[val])
                {
                    data.splice(c, 1);
                    c--;
                    //.delete data[key];
                }
                got[val] = true;
            }
        }

        if(sort)
        {
            var sort_array = sort.split(",");
            data = data.sort(function (a, b) {
                //for(var key = 0; key<sort_array.length; sort++) {
                //    sort = sort_array[key];
                for(var key in sort_array) {
                    sort = sort_array[key];
                    if (a.attributes[sort] === undefined) {
                        return 1;
                    }
                    if (b.attributes[sort] === undefined) {
                        return -1;
                    }
                    if (a.attributes[sort].localeCompare) {
                        if(a.attributes[sort].localeCompare(b.attributes[sort])!=0)
                            return a.attributes[sort].localeCompare(b.attributes[sort]);
                    }
                    if(a.attributes[sort] - b.attributes[sort]!=0)
                    {
                        return a.attributes[sort] - b.attributes[sort]>0?1:-1;
                    }
                }
                return 0;
                //}
                //return 0;
            });
            console.log("sorted");
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