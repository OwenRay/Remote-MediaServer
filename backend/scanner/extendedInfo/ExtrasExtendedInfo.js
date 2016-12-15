"use strict";
/**
 * Created by owenray on 29-06-16.
 */

var IExtendedInfo = require("./IExtendedInfo");
var Promise = require("node-promise").Promise;
var Database = require("../../Database");
var path = require('path');

class ExtrasExtendedInfo extends IExtendedInfo
{
    extendInfo(args)
    {
        var mediaItem = args[0];
        var library = args[1];
        var promise = new Promise();
        if(!mediaItem.attributes.extra||mediaItem.attributes["external-id"]) {
            promise.resolve(args);
            return promise;
        }

        var fileParts = mediaItem.attributes.filepath;
        for(var c = 0; c<2; c++) {
            fileParts = path.parse(fileParts).dir;
            var items = Database.findByMatchFilters("media-item", {filepath: fileParts + "%"});
            for (var key in items) {
                if (items[key].id == mediaItem.id) {
                    items.splice(key, 1);
                }
            }
            if(items.length) {
                break;
            }
        }
        if(items.length)
        {
            mediaItem.attributes["exernal-id"] = items[0].attributes["external-id"];
            mediaItem.attributes["external-episode-id"] = items[0].attributes["external-episode-id"];
        }else{
            mediaItem.attributes.extra = false;
        }
        Database.update("media-item", mediaItem);
        promise.resolve([mediaItem, library])

        return promise;
    }
}

module.exports = ExtrasExtendedInfo;