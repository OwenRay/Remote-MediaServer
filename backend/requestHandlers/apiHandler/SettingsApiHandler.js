/**
 * Created by Owen on 14-4-2016.
 */
"use strict";
const IApiHandler = require("./IApiHandler");
const Settings = require("../../Settings.js");
const Log = require("../../helpers/Log");

class SettingsApiHandler extends IApiHandler
{
    handle(request, response)
    {
        const urlParts = request.url.split("/");
        const type = urlParts[2];
        if(type!=="settings")
        {
            return false;
        }

        response.setHeader("Content-Type", "text/json");
        if(request.method==="PATCH")
        {
            let body = "";
            request.on('data', function (data) {
                body += data;
            });
            request.on('end', function () {
                try{
                    const data = JSON.parse(body);
                    const attrs = data.data.attributes;
                    for(let key in attrs)
                    {
                        Settings.setValue(key, attrs[key]);
                    }
                    Settings.save();
                }catch(e){
                    Log.exception("Exception", e);
                }
                this.respond(response);
            }.bind(this));
        }else{
            this.respond(response);
        }
        return true;
    }

    respond(response)
    {
        const json = JSON.stringify({data: {id: 1, type: "setting", attributes: Settings.getAll()}});
        response.end(json);
    }
}

module.exports = SettingsApiHandler;