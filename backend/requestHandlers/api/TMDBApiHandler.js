const RequestHandler = require("../RequestHandler");
const httpServer = require("../../HttpServer");
const Settings = require("../../Settings");
const MovieDB = require('moviedb')(Settings.getValue("tmdb_apikey"));
let genreCache;

class TMDBApiHandler extends RequestHandler {
    handleRequest() {
        if(genreCache) {
            this.context.body = genreCache;
            return;
        }

        return new Promise((resolve, reject) =>{
            MovieDB.genreMovieList((err,res)=>{
                MovieDB.genreTvList((err2,res2)=> {
                    if (err || err2) {
                        reject();
                    }
                    let haveIds = [];
                    res = res.genres;
                    res2 = res2.genres;
                    genreCache = [];
                    for(let key in res) {
                        haveIds[res[key].id] = true;
                        genreCache.push(res[key]);
                    }
                    for(let key in res2) {
                        if(!haveIds[res2[key].id])
                            genreCache.push(res2[key]);
                    }
                    genreCache.sort(
                        (a,b) => {
                            return a.name.localeCompare(b.name);
                        }
                    );

                    this.context.body = genreCache;
                    resolve();
                });
            });
        });
    }
}

httpServer.registerRoute("get", "/api/tmdb/genres", TMDBApiHandler);

module.exports = TMDBApiHandler;
