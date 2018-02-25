"use strict";
/**
 * Created by owenray on 29-06-16.
 */
const IExtendedInfo = require("./IExtendedInfo");
const Prom = require("node-promise").Promise;
const Database = require("../../Database");
const path = require('path');

class ExtrasExtendedInfo extends IExtendedInfo
{
    extendInfo(mediaItem, library)
    {
        if(!mediaItem.attributes.extra||mediaItem.attributes["external-id"]) {
            return;
        }
        //If external id has not been detected yet and items is an extra
        let items;

        //find all items with the same path, filtering out this item
        let fileParts = mediaItem.attributes.filepath;
        for(let c = 0; c<2; c++) {
            fileParts = path.parse(fileParts).dir;
            items = Database.findByMatchFilters("media-item", {filepath: fileParts + "%"});
            for (let key in items) {
                if (items[key].id === mediaItem.id) {
                    items.splice(key, 1);
                }
            }
            if(items.length) {
                break;
            }
        }

        //have we found an item? give this item the same ids
        if(items.length)
        {
            mediaItem.attributes["exernal-id"] = items[0].attributes["external-id"];
            mediaItem.attributes["external-episode-id"] = items[0].attributes["external-episode-id"];
        }else{
            mediaItem.attributes.extra = false;
        }
    }
}

module.exports = ExtrasExtendedInfo;
