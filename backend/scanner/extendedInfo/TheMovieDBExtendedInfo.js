"use strict";
/**
 * Created by owenray on 29-06-16.
 */
const IExtendedInfo = require("./IExtendedInfo");
const Prom = require("node-promise").Promise;
const Settings = require("../../Settings");
const MovieDB = require('moviedb')(Settings.getValue("tmdb_apikey"));
const path = require('path');
const Database = require("../../Database");
const Log = require("../../helpers/Log");

const discardRegex = new RegExp('\\W|-|_|([0-9]+p)|(LKRG)', "g");

class TheMovieDBExtendedInfo extends IExtendedInfo
{
    extendInfo(args, tryCount)
    {
        const mediaItem = args[0];
        const library = args[1];
        if(!tryCount)
        {
            tryCount = 0;
        }

        const promise = new Prom();

        if(mediaItem.attributes.gotExtendedInfo)
        {
            promise.resolve([mediaItem, library]);
            return promise;
        }
        Log.debug("process tmdb", mediaItem.id);

        const callback = function (err, res) {
            if (!err) {
                res = library.type !== "tv" ?
                    (res.results && res.results.length > 0 ? res.results[0] : null)
                    : res;
            }
            if (res) {
                if (library.type === "tv") {
                    res["external-episode-id"] = res.id;
                    res["episode-title"] = res.name;
                    delete res.name;
                }
                else {
                    res["external-id"] = res.id;
                }
                delete res.id;
                for (let key in res) {
                    mediaItem.attributes[key.replace(/_/g, "-")] = res[key];
                }
                let date = res.release_date ? res.release_date : res.first_air_date;
                date = date ? date : res.air_date;

                mediaItem.attributes["release-date"] = date;
                if (date) {
                    mediaItem.attributes.year = date.split("-")[0];
                }
                mediaItem.attributes.gotExtendedInfo = true;
                Database.update("media-item", mediaItem);
            } else if (tryCount < 2) {

                this.extendInfo([mediaItem, library], tryCount + 1).then(promise.resolve);
                return;
            }
            promise.resolve([mediaItem, library]);
        }.bind(this);

        //If the movie cannot be found:
        // 1. try again without year,
        // 2. Then try again with the filename

        let params = {query: mediaItem.attributes.title};

        if(mediaItem.attributes.episode)
        {
            params.query+=" "+mediaItem.attributes.episode;
        }

        switch(tryCount)
        {
            case 0:
                params.year = mediaItem.attributes.year;
                break;
            case 2:
                params.query = path.parse(mediaItem.attributes.filepath).base.split(".")[0];
                params.query = params.query.replace(discardRegex, " ");
                break;
        }

        let searchMethod = MovieDB.searchMovie;
        switch(library.type)
        {
            case "tv":
                searchMethod = MovieDB.tvEpisodeInfo;
                params = {};
                params.id = mediaItem.attributes["external-id"];
                params.season_number = mediaItem.attributes.season;
                params.episode_number = mediaItem.attributes.episode;
                params.episode_number = mediaItem.attributes.episode;
                break;
        }

        searchMethod = searchMethod.bind(MovieDB);
        function makeCall()
        {
            searchMethod(
                params,
                callback
            );
            TheMovieDBExtendedInfo.lastRequest = new Date().getTime();
        }
        //to make sure the api only gets called every 300ms
        const waitFor = 300 - (new Date().getTime() - TheMovieDBExtendedInfo.lastRequest);
        if(waitFor<20)
        {
            makeCall();
        }else
        {
            setTimeout(makeCall, waitFor);
        }
        return promise;
    }
}

TheMovieDBExtendedInfo.lastRequest = 0;


module.exports = TheMovieDBExtendedInfo;
