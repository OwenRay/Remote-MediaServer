/**
 * Created by owenray on 08-04-16.
 */
"use strict";
var RequestHandler = require("./RequestHandler");
var SettingsApiHandler = require("./apiHandler/SettingsApiHandler");
var DatabaseApiHandler = require("./apiHandler/DatabaseApiHandler");


class ApiRequestHandler extends RequestHandler{
    handleRequest()
    {
        for(var c = 0; c<ApiRequestHandler.chain.length && !ApiRequestHandler.chain[c].handle(this.request, this.response); c++)
            ;
    }
}

ApiRequestHandler.chain = [
        new SettingsApiHandler(),
        new DatabaseApiHandler()
    ];

module.exports = ApiRequestHandler;