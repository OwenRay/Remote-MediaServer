/**
 * Created by owenray on 08-04-16.
 */
"use strict";
var Database = require("../Database");
var RequestHandler = require("./RequestHandler");

var Mpeg4PlayHandler = require("./PlayHandler/Mpeg4PlayHandler");
var HLSPlayHandler = require("./PlayHandler/HLSPlayHandler");

class PlayRequestHandler extends RequestHandler{
    handleRequest()
    {
        var parts = this.request.url.split("/");
        var offset = parts.pop();
        var mediaItem = Database.getById("media-item", parts.pop());
        if(!mediaItem)
        {
            return this.response.end();
        }
        
        var handlers = [
            HLSPlayHandler,
            Mpeg4PlayHandler,
        ];
        for(var c = 0; c<handlers.length; c++) {
            if(new handlers[c]().play(mediaItem, offset, this.request, this.response)) {
                break;
            }
        }
    }
}

module.exports = PlayRequestHandler;
