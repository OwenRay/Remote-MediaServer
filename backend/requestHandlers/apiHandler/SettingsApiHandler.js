/**
 * Created by Owen on 14-4-2016.
 */
"use strict";
const RequestHandler = require("../RequestHandler");
const Settings = require("../../Settings.js");
const Log = require("../../helpers/Log");

class SettingsApiHandler extends RequestHandler
{
    handleRequest()
    {
        this.response.setHeader("Content-Type", "text/json");
        if(this.request.method==="PATCH")
        {
            let body = "";
            this.request.on('data', function (data) {
                body += data;
            });
            this.request.on('end', function () {
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
                this.respond();
            }.bind(this));
        }else{
            this.respond();
        }
        return true;
    }

    respond()
    {
        const json = JSON.stringify({data: {id: 1, type: "setting", attributes: Settings.getAll()}});
        this.response.end(json);
    }
}

require("../../HttpServer")
    .registerRoute("all", "/api/settings/:unused_id", SettingsApiHandler);

module.exports = SettingsApiHandler;