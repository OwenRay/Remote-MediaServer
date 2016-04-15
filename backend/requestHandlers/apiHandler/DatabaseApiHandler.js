/**
 * Created by Owen on 14-4-2016.
 */
"use strict";;
var Database = require("../../Database");
var pluralize = require('pluralize');
var IApiHandler = require("./IApiHandler");

class DatabaseApiHandler extends IApiHandler
{
    handle(request, response)
    {
        var urlParts = request.url.split("/");
        var type = urlParts[2];
        var singularType = pluralize.singular(type);
        response.setHeader("Content-Type", "text/json");

        var data;
        if(!isNaN(parseInt(urlParts[3])))
        {
            data = Database.getById(singularType, parseInt(urlParts[3]));
        }else{
            data = Database.getAll(singularType);
        }
        var json = JSON.stringify({data:data});
        response.end(json);
        return true;
    }
}

module.exports = DatabaseApiHandler;