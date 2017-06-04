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
        this.response.header["Content-Type"] = "text/json";

        if(this.request.method==="PATCH")
        {
            return new Promise(resolve=> {
                let body = "";
                this.context.req.on('data', data=>{
                    body += data;
                }).on('end', ()=>{
                    try {
                        const data = JSON.parse(body);
                        const attrs = data.data.attributes;
                        for (let key in attrs) {
                            Settings.setValue(key, attrs[key]);
                        }
                        Settings.save();
                    } catch (e) {
                        Log.exception("Exception", e);
                    }
                    this.respond();
                    resolve();
                });
            });
        }else{
            this.respond();
        }
        return true;
    }

    respond()
    {
        this.context.body = {data: {id: 1, type: "setting", attributes: Settings.getAll()}};
    }
}

require("../../HttpServer")
    .registerRoute("all", "/api/settings/:unused_id", SettingsApiHandler);

module.exports = SettingsApiHandler;