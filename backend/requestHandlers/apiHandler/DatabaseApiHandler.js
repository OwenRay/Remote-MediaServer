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
        if (!isNaN(parseInt(urlParts[3]))) {
            data = Database.getById(singularType, parseInt(urlParts[3]));
        } else if (url.query) {
            var query = querystring.parse(url.query);
            data = Database.findByMatchFilters(singularType, query);
        }else{
            data = Database.getAll(singularType);
        }
        var json = JSON.stringify({data:data});
        response.end(json);
        return true;
    }
}

module.exports = DatabaseApiHandler;