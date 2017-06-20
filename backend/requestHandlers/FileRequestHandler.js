/**
 * Created by owenray on 08-04-16.
 */
"use strict";

const fs = require('fs');
const mime = require('mime');
const Log = require("../helpers/Log");

const RequestHandler = require("./RequestHandler");

class FileRequestHandler extends RequestHandler{
    handleRequest()
    {
        let url = this.context.url;
        const dir = __dirname + "/../../frontend/dist/";
        new Promise(resolve=>{
            this.resolve = resolve;
        });
        this.serveFile(dir+url, false, this.resolve);
    }

    serveFile(filename, andDelete, callback) {
        this.response.header['Content-Type'] = mime.lookup(filename);
        this.andDelete = andDelete;
        this.file = filename;
        this.resolve = callback;
        fs.readFile(filename, this.fileRead.bind(this));
    }

    fileRead(err, data)
    {
        if(err)
        {
            return this.resolve();
        }

        this.context.body = data;
        if(this.resolve) {
            this.resolve();
        }

        if(this.andDelete) {
            fs.unlink(this.file, ()=>{
                Log.info("delete", arguments, this.file);
            });
        }
    }
}

//export RequestHandler;
module.exports = FileRequestHandler;
