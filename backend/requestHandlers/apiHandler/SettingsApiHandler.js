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
            var body = "";
            request.on('data', function (data) {
                body += data;
            });
            request.on('end', function () {
                try{
                    var data = JSON.parse(body);
                    var attrs = data.data.attributes;
                    for(var key in attrs)
                    {
                        Settings[key] = attrs[key];
                    }
                    Settings.save();
                }catch(e){};
                this.respond(response);
            }.bind(this));
        }else{
            this.respond(response);
        }
        return true;
    }

    respond(response)
    {
        var json = JSON.stringify({data:{id:1, type:"setting", attributes:Settings}});
        response.end(json);
    }
}

module.exports = SettingsApiHandler;