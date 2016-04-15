/**
 * Created by Owen on 14-4-2016.
 */
"use strict";
var IApiHandler = require("./IApiHandler");
var Settings = require("../../Settings.js");

class SettingsApiHandler extends IApiHandler
{
    handle(request, response)
    {
        var urlParts = request.url.split("/");
        var type = urlParts[2];
        if(type!="settings")
        {
            return false;
        }

        response.setHeader("Content-Type", "text/json");
        if(request.method=="PATCH")
        {
            console.log(request);
        }

        var json = JSON.stringify({data:{id:1, type:"setting", attributes:Settings}});
        response.end(json);
        return true;
    }
}

module.exports = SettingsApiHandler;