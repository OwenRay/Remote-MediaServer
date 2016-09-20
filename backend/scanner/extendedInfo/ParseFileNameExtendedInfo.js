"use strict";
/**
 * Created by owenray on 29-06-16.
 */
var IExtendedInfo = require("./IExtendedInfo");
var Guessit = require("../Guessit");
var Promise = require("node-promise").Promise;
var Database = require("../../Database");
var path = require('path');

class ParseFileNameExtendedInfo extends IExtendedInfo
{
    extendInfo(args, tryCount)
    {
        var mediaItem = args[0];
        var library = args[1];
        if(!tryCount)
        {
            tryCount = 0;
        }

        var promise = new Promise();

        var relativePath = mediaItem.attributes.filepath;

        if(mediaItem.attributes.title) {
            promise.resolve([mediaItem, library]);
            return promise;
        }

        var filePath = path.parse(relativePath);
        var folder = path.parse(filePath.dir);
        var extraGuessitOptions = [];
        var fileParts = filePath.dir.split(path.sep);

        var season = "";
        var serieName = "";
        if(library.type=="tv") {
            var offset;
            for (offset = 0; offset < fileParts.length; offset++) {
                // the first directory we find containing season info is probably the child directory
                // Of the directory containing the season name.
                var seasonCheck = fileParts[offset].replace(/^.*?(s|se|season)[^a-zA-Z0-9]?([0-9]+).*?$/i, "$2");
                if (seasonCheck != fileParts[offset]) {
                    season = parseInt(seasonCheck);
                    break;
                }
            }
            if (season && offset > 0) {
                var serieName = fileParts[offset - 1];
                extraGuessitOptions.push("-T "+serieName);
            }
        }

        var searchQuery = filePath.base.replace(/ /g, '.');

        if(tryCount==1)
        {
            searchQuery = folder.base.replace(/ /g, '.') + "-" + filePath.base.replace(/ /g, '.');
        }

        Guessit.parseName(
                searchQuery,
                {options:"-t "+library.type+" "+extraGuessitOptions.join(" ")}
            ).then(
                function (data) {
                    if (tryCount == 1 && data.title) {
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
                    this.extendInfo([mediaItem, library], tryCount + 1).then(resolve);
                }.bind(this),
                function() {
                    resolve([mediaItem, library]);
                }
            );
        return promise;
    }
}

module.exports = ParseFileNameExtendedInfo;