/**
 * Created by owenray on 08-04-16.
 */
"use strict";

const RequestHandler = require("./RequestHandler");

class CorsRequestHandler extends RequestHandler{
    handleRequest()
    {

        this.response.setHeader("Access-Control-Allow-Origin", "*");
        this.response.setHeader("Access-Control-Allow-Methods", "*");
        this.response.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if(this.request.method==="OPTIONS")
        {
            this.response.end();
            return true;
        }
        return false;
    }
}

//export RequestHandler;
module.exports = CorsRequestHandler;
