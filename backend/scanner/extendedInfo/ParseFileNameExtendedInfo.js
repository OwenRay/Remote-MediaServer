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

        var searchQuery = filePath.base.replace(/ /g, '.');

        if(tryCount==1)
        {
            searchQuery = folder.base.replace(/ /g, '.') + "-" + filePath.base.replace(/ /g, '.');
        }
        Guessit.parseName(
                searchQuery,
                {options:"-t "+library.type}
            ).then(
                function (data) {
                    if (tryCount == 1 && data.title) {
                        data.title = data.title.replace(folder.base + '-', '');
                    }
                    if (data.title) {
                        mediaItem.attributes.title = data.title;
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