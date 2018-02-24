"use strict";

const Database = require("./Database");
const Log = require("./helpers/Log");

class Migrate
{
    static run() {
        while(this["version"+Database.version]) {
            Log.info("running migration", Database.version);
            this["version"+Database.version]();
            Database.version++;
            Database.save();
        }
    }

    static version0() {
        const items = Database.getAll("media-item");
        for(let key in items) {
            const p = items[key].relationships&&items[key].relationships["play-position"];
            if(p) {
                const i = Database.getById("play-position", p.data.id);
                i.attributes.watched = i.attributes.position>items[key].attributes.fileduration*.97;
            }
        }
    }
}

module.exports = Migrate;
