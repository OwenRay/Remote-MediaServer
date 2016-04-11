/**
 * Created by owenray on 08-04-16.
 */
"use strict";
var path = require("path");
var Database = require("../Database");
var pluralize = require('pluralize');

var RequestHandler = require("./RequestHandler");

class ApiRequestHandler extends RequestHandler{
    handleRequest()
    {
        console.log(this.request.url);
        var url = path.parse(this.request.url);
        var urlParts = this.request.url.split("/");
        var type = urlParts[2];
        var singularType = pluralize.singular(type);
        this.response.setHeader("Content-Type", "text/json");

        var data;
        if(!isNaN(parseInt(urlParts[3])))
        {
            data = Database.getById(singularType, parseInt(urlParts[3]));
        }else{
            data = Database.getAll(singularType);
        }
        var json = JSON.stringify({data:data});
        this.response.end(json);
    }
}

module.exports = ApiRequestHandler;