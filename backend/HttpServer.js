/**
 * Created by Owen on 15-4-2016.
 */
"use strict";
//const http = require('http');
const Settings = require('./Settings');
const Log = require("./helpers/Log");
const glob = require( 'glob' );
const path = require( 'path' );

const Koa = require('koa');
const Router = require('koa-router');
const Static = require('koa-static');

class HttpServer {
    constructor ()
    {
        this.server = new Koa();
        this.router = new Router();
        this.routes = [];
    }

    start() {
        Log.info("starting http server");
        if(!this.firstStarted) {
            Settings.addObserver("port", this.onPortChange.bind(this));
        }
        this.firstStarted = true;

        glob.sync(__dirname+"/requestHandlers/**/*.js").forEach(function(file){
            console.log("require", file);
            require(path.resolve(file));
        });

        this.server.use(this.router.routes());
        this.server.use(this.router.allowedMethods());
        this.server.use(new Static(__dirname+"/../frontend/dist"));
        this.server.use(function(context, next){
            console.log(this, arguments);
            if(context.url.split("?")[0].indexOf(".")===-1) {
                console.log("change url");
                context.url = "/";
            }
            return next();
        });
        this.server.use(new Static(__dirname+"/../frontend/dist"));

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

    /**
     *
     * @param method
     * @param path
     * @param {RequestHandler} requestHandler
     */
    registerRoute(method, path, RequestHandler, priority) {
        if (!priority) {
            priority = 0;
        }
        var route = method+"@"+path;

        //if there's no such route yet, register it
        if (!this.routes[route]) {
            this.routes[route] = [];

            this.router[method](path, context=>{

                //run routes by priority, if one returns true, we'll stop propagating
                for(let c = 10; c>=-10; c--)
                {
                    var R = this.routes[route][c];
                    if(R){
                        var result = new R(method, path, context).handleRequest();
                        console.log("result", result);
                        if(result) {
                            return result;
                        }
                    }
                }
            });
        }
        this.routes[route][priority] = RequestHandler;
    }

    /*handleRequest(request, response) {
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
    }*/

    onPortChange()
    {
        Log.info("onPortChange", this);
        this.stop(this.start.bind(this));
    }
}

module.exports = new HttpServer();
