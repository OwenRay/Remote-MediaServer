/**
 * Created by Owen on 15-4-2016.
 */
"use strict"
var http = require('http');
var FileRequestHandler = require('./requestHandlers/FileRequestHandler');
var ApiRequestHandler = require('./requestHandlers/ApiRequestHandler');
var PlayRequestHandler = require('./requestHandlers/PlayRequestHandler');
var CorsRequestHandler = require('./requestHandlers/CorsRequestHandler');
var ImageRequestHandler = require("./requestHandlers/ImageRequestHandler");
var Settings = require('./Settings');
var enableDestroy = require('server-destroy');

class HttpServer {

    start() {

        console.log("starting http server");
        if(!this.firstStarted) {
            Settings.addObserver("port", this.onPortChange.bind(this));
        }

        this.firstStarted = true;
        //Create a server
        this.server = http.createServer(this.handleRequest);
        enableDestroy(this.server);

        //Lets start our server
        this.server.listen(Settings.getValue("port"), this.onConnected);
    }

    stop(and)
    {
        console.log("shutting down http server");
        this.server.destroy(and);
    }

    onConnected()
    {
        console.log("Server listening on: http://localhost:%s", Settings.getValue("port"));
    }

    handleRequest(request, response) {
        if(new CorsRequestHandler(request, response).handleRequest())
        {
            return;
        }

        var handlers = {
            api: ApiRequestHandler,
            ply: PlayRequestHandler,
            web: FileRequestHandler,
			img: ImageRequestHandler
        };
        var part = request.url.substr(1, 3);
        if (!handlers[part]) {
            part = "web";
        }
        new handlers[part](request, response).handleRequest();
    }

    onPortChange()
    {
        console.log("onPortChange", this)
        this.stop(this.start.bind(this));
    }
}

module.exports = HttpServer;
