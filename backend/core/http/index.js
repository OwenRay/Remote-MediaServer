/**
 * Created by Owen on 15-4-2016.
 */

const Settings = require('../Settings');
const Log = require('../Log');

const Koa = require('koa');
const Router = require('koa-router');
const Static = require('koa-static');
const cors = require('koa-cors');
const nodeCache = require('node-file-cache');
const destroyable = require('server-destroy');
const bodyParser = require('koa-bodyparser');
const opn = require('opn');
const ip = require('ip');
const https = require('https');


let server;
let serverInstance;
let httpsServerInstance;
let cache;
let running = false;
const router = new Router();
const cacheRoute = [];
const routes = {};

class HttpServer {
  static preflight() {
    cache = nodeCache.create({ file: `${process.cwd()}/cache/httpCache` });
    Settings.addObserver('port', HttpServer.onPortChange);
    server = new Koa();
    server.use(cors({ origin: '*', methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH'] }));
    // eslint-disable-next-line global-require
    require('./coreHandlers');
  }

  static async sslRedirect(ctx, next) {
    if (Settings.getValue('sslredirect') && httpsServerInstance && !ctx.req.client.encrypted) {
      ctx.redirect(`https://${Settings.getValue('ssldomain')}.theremote.io:${Settings.getValue('sslport')}${ctx.originalUrl}`);
    }
    return next();
  }

  static async start() {
    Log.info('starting http server');
    server.use(HttpServer.sslRedirect);
    server.use(bodyParser());
    server.use(router.routes());
    server.use(router.allowedMethods());

    // make sure frontend javascript url handling works.
    // for example /library/list redirects to /
    server.use((context, next) => {
      if (context.url.split('?')[0].indexOf('.') === -1) {
        context.url = '/';
      }
      return next();
    });
    server.use(new Static(`${__dirname}/../../../frontend/build`));

    // Lets start our server
    serverInstance = server.listen(Settings.getValue('port'), Settings.getValue('bind'), HttpServer.onConnected);
    destroyable(serverInstance);

    if (!Settings.getValue('ssl').key) return;
    httpsServerInstance = https.createServer(Settings.getValue('ssl'), server.callback());
    httpsServerInstance.listen(Settings.getValue('sslport'), Settings.getValue('bind'));
    destroyable(httpsServerInstance);
    running = true;
  }

  static stop(and) {
    if (!running) return;

    running = false;
    Log.info('shutting down http server');
    let cbCount = 1;
    const cb = () => {
      cbCount -= 1;
      if (cbCount === 0) and();
    };
    if (httpsServerInstance) {
      cbCount += 1;
      httpsServerInstance.destroy(cb);
    }
    serverInstance.destroy(cb);
  }

  static async onConnected() {
    let host = Settings.getValue('bind');
    if (host === '0.0.0.0') host = ip.address();
    try {
      if (Settings.getValue('startopen')) {
        await opn(`http://${host}:${Settings.getValue('port')}`);
      }
    } catch (e) {
      Log.debug(e);
    }
    Log.info('Server listening on: http://localhost:%s', Settings.getValue('port'));
  }

  /**
     *
     * @param {string} method
     * @param {string} routepath
     * @param {RequestHandler} RequestHandler
     * @param {int} cacheFor
     * @param {int} priority
     */
  static registerRoute(method, routepath, RequestHandler, cacheFor, priority) {
    if (!priority) {
      priority = 0;
    }
    const route = `${method}@${routepath}`;
    cacheRoute[`${route}@${priority}`] = cacheFor;

    // if there's no such route yet, register it
    if (!routes[route]) {
      routes[route] = {};

      router[method](routepath, context => HttpServer.checkCache(
        context,
        `${route}@${priority}`,
        () => {
          // run routes by priority, if one returns true, we'll stop propagating
          for (let c = 10; c >= -10; c -= 1) {
            const R = routes[route][c];
            if (R) {
              const result = new R(context, method, routepath).handleRequest();
              if (result) {
                return result;
              }
            }
          }
          return false;
        },
      ));
    }
    routes[route][priority] = RequestHandler;
    return HttpServer;
  }

  static getRoutes() {
    return routes;
  }

  static checkCache(context, key, func) {
    const cacheFor = cacheRoute[key];
    if (!cacheFor) {
      return func();
    }

    const entry = cache.get(context.url);
    if (entry) {
      context.body = entry;
      return true;
    }

    return new Promise((resolve) => {
      Promise.resolve(func()).then(() => {
        if (context.body) {
          const cacheObj = context.body;
          cache.set(context.url, cacheObj, { life: cacheFor }, [key]);
        }
        resolve();
      });
    });
  }

  static onPortChange() {
    Log.info('onPortChange', this);
    HttpServer.stop(HttpServer.start);
  }
}

module.exports = HttpServer;
