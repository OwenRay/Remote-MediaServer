/**
 * Created by owenray on 08-04-16.
 */
"use strict";

class Database {

    constructor()
    {
        this.files = [];
    }

    add(filename, obj)
    {
        this.files[filename] = item;
    }

    getInfo(filename)
    {
        return this.files[filename];
    }
}

//export RequestHandler;
module.exports = new Database();