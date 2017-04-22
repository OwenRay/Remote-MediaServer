"use strict";
/**
 * Created by owenray on 29-06-16.
 */
const IExtendedInfo = require("./IExtendedInfo");
const Guessit = require("../Guessit");
const Prom = require("node-promise").Promise;
const Database = require("../../Database");
const path = require('path');
const Log = require("../../helpers/Log");

class ParseFileNameExtendedInfo extends IExtendedInfo
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

        const relativePath = mediaItem.attributes.filepath;

        if(mediaItem.attributes.title) {
            promise.resolve([mediaItem, library]);
            return promise;
        }
        Log.debug("parse filename", mediaItem.id);

        const filePath = path.parse(relativePath);
        const folder = path.parse(filePath.dir);
        const extraGuessitOptions = [];
        const fileParts = filePath.dir.split(path.sep);

        let season = "";
        let serieName = "";
        if(library.type==="tv") {
            let offset;
            for (offset = 0; offset < fileParts.length; offset++) {
                // the first directory we find containing season info is probably the child directory
                // Of the directory containing the season name.
                const seasonCheck = fileParts[offset].replace(/^.*?(s|se|season)[^a-zA-Z0-9]?([0-9]+).*?$/i, "$2");
                if (seasonCheck !== fileParts[offset]) {
                    season = parseInt(seasonCheck);
                    break;
                }
            }
            if (season && offset > 0) {
                serieName = fileParts[offset - 1];
                extraGuessitOptions.push("-T "+serieName);
            }
        }

        let searchQuery = filePath.base.replace(/ /g, '.');

        if(tryCount===1)
        {
            searchQuery = folder.base.replace(/ /g, '.') + "-" + filePath.base.replace(/ /g, '.');
        }

        Guessit.parseName(
                searchQuery,
                {options:"-t "+library.type+" "+extraGuessitOptions.join(" ")}
            ).then(
                function (data) {
                    if (tryCount === 1 && data.title) {
                        data.title = data.title.replace(folder.base + '-', '');
                    }
                    if (data.title) {
                        if(season)
                        {
                            data.season = season;
                        }
                        if(serieName)
                        {
                            mediaItem.attributes["episode-title"] = data["episode-title"]?data["episode-title"]:data.title;
                            data.title = serieName;
                        }
                        mediaItem.attributes.season = data.season;
                        mediaItem.attributes.episode = data.episode;
                        mediaItem.attributes.title = data.title;
                        mediaItem.attributes.type = library.type;
                        Database.update("media-item", mediaItem);
                        return promise.resolve([mediaItem, library]);
                    }
                    if(tryCount>=1)
                    {
                        return promise.resolve([mediaItem, library]);
                    }
                    this.extendInfo([mediaItem, library], tryCount + 1).then(promise.resolve);
                }.bind(this),
                function() {
                    promise.resolve([mediaItem, library]);
                }
            );
        return promise;
    }
}

module.exports = ParseFileNameExtendedInfo;