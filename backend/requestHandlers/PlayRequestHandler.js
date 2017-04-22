/**
 * Created by owenray on 08-04-16.
 */
"use strict";
const Database = require("../Database");
const RequestHandler = require("./RequestHandler");

const Mpeg4PlayHandler = require("./PlayHandler/Mpeg4PlayHandler");
const HLSPlayHandler = require("./PlayHandler/HLSPlayHandler");

class PlayRequestHandler extends RequestHandler{
    handleRequest()
    {
        const parts = this.request.url.split("/");
        const offset = parts.pop();
        let mediaItem = Database.getById("media-item", parts.pop());
        if(!mediaItem)
        {
            return this.response.end();
        }
        
        const handlers = [
            HLSPlayHandler,
            Mpeg4PlayHandler
        ];
        for(let c = 0; c<handlers.length; c++) {
            if(new handlers[c]().play(mediaItem, offset, this.request, this.response)) {
                break;
            }
        }
    }
}

module.exports = PlayRequestHandler;
