/**
 * Created by Owen on 15-4-2016.
 */
"use strict";
const http = require('http');
const FileRequestHandler = require('./requestHandlers/FileRequestHandler');
const ApiRequestHandler = require('./requestHandlers/ApiRequestHandler');
const PlayRequestHandler = require('./requestHandlers/PlayRequestHandler');
const CorsRequestHandler = require('./requestHandlers/CorsRequestHandler');
const ImageRequestHandler = require("./requestHandlers/ImageRequestHandler");
const Settings = require('./Settings');
const enableDestroy = require('server-destroy');
const Log = require("./helpers/Log");

class HttpServer {

    start() {

        Log.info("starting http server");
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
        Log.info("shutting down http server");
        this.server.destroy(and);
    }

    onConnected()
    {
        Log.info("Server listening on: http://localhost:%s", Settings.getValue("port"));
    }

    handleRequest(request, response) {
        if(new CorsRequestHandler(request, response).handleRequest())
        {
            return;
        }

        const handlers = {
            api: ApiRequestHandler,
            ply: PlayRequestHandler,
            web: FileRequestHandler,
            img: ImageRequestHandler
        };
        let part = request.url.substr(1, 3);
        if (!handlers[part]) {
            part = "web";
        }
        new handlers[part](request, response).handleRequest();
    }

    onPortChange()
    {
        Log.info("onPortChange", this);
        this.stop(this.start.bind(this));
    }
}

module.exports = HttpServer;
