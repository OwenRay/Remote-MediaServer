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
const cors = require('koa-cors');
const cache = require('node-file-cache');
const destroyable = require('server-destroy');


class HttpServer {
    constructor ()
    {
        this.cache = cache.create({file:process.cwd()+'/cache/httpCache'});
        this.router = new Router();
        this.cacheRoute = [];
        this.routes = [];
    }

    start() {
        Log.info("starting http server");
        if(!this.firstStarted) {
            Settings.addObserver("port", this.onPortChange.bind(this));
        }
        this.firstStarted = true;
        this.server = new Koa();

        this.server.use(cors( {origin: '*'}));
        glob.sync(__dirname+"/requestHandlers/**/*.js").forEach(function(file){
            require(path.resolve(file));
        });

        this.server.use(this.router.routes());
        this.server.use(this.router.allowedMethods());

        // make sure frontend javascript url handling works.
        // for example /library/list redirects to /
        this.server.use(function(context, next){
            if(context.url.split("?")[0].indexOf(".")===-1) {
                context.url = "/";
            }
            return next();
        });
        this.server.use(new Static(__dirname+"/../frontend/dist"));

        //Lets start our server
        this.serverInstance = this.server.listen(Settings.getValue("port"), this.onConnected);
        destroyable(this.serverInstance);
    }

    stop(and)
    {
        Log.info("shutting down http server");
        this.serverInstance.destroy(and);
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
    registerRoute(method, path, RequestHandler, cacheFor, priority) {
        if (!priority) {
            priority = 0;
        }
        const route = method+"@"+path;
        this.cacheRoute[route+"@"+priority] = cacheFor;

        //if there's no such route yet, register it
        if (!this.routes[route]) {
            this.routes[route] = [];

            this.router[method](path, context => {
                return this.checkCache(
                    context,
                    route+"@"+priority,
                    ()=>{
                        //run routes by priority, if one returns true, we'll stop propagating
                        for (let c = 10; c >= -10; c--) {
                            const R = this.routes[route][c];
                            if (R) {
                                const result = new R(context, method, path).handleRequest();
                                if (result) {
                                    return result;
                                }
                            }
                        }
                    });
            });
        }
        this.routes[route][priority] = RequestHandler;
    }

    checkCache(context, key, func)
    {
        const cacheFor = this.cacheRoute[key];
        if(!cacheFor) {
            return func();
        }

        let entry = this.cache.get(context.url);
        if(entry) {
            context.body = entry;
            return;
        }

        return new Promise(resolve=> {
            Promise.resolve(func()).then(() => {
                if (context.body) {
                    var cacheObj = context.body;
                    this.cache.set(context.url, cacheObj, {life:cacheFor}, [key]);
                }
                resolve();
            });
        });
    }

    onPortChange()
    {
        Log.info("onPortChange", this);
        this.stop(this.start.bind(this));
    }
}

module.exports = new HttpServer();
