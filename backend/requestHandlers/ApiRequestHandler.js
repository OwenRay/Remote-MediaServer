"use strict";

const RequestHandler = require("./RequestHandler");
const SettingsApiHandler = require("./apiHandler/SettingsApiHandler");
const DatabaseApiHandler = require("./apiHandler/DatabaseApiHandler");
const DirectoryBrowserHandler = require("./apiHandler/DirectoryBrowserHandler");
const SubtitleApiHandler = require("./apiHandler/SubtitleApiHandler");
const url = require('url');

class ApiRequestHandler extends RequestHandler{
    handleRequest()
    {
        let parsedUrl = url.parse(this.request.url);
        for(let c = 0; c<ApiRequestHandler.chain.length && !new (ApiRequestHandler.chain[c])().handle(this.request, this.response, parsedUrl); c++) {
        }
    }
}

ApiRequestHandler.chain = [
        SettingsApiHandler,
        DirectoryBrowserHandler,
        SubtitleApiHandler,
        DatabaseApiHandler
    ];

module.exports = ApiRequestHandler;