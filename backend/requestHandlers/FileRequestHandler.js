/**
 * Created by owenray on 08-04-16.
 */
"use strict";

const fs = require('fs');
const mime = require('mime');
const path = require('path');
const Log = require("../helpers/Log");

const RequestHandler = require("./RequestHandler");

class FileRequestHandler extends RequestHandler{
    handleRequest()
    {
        //this.response.end("ok");

        let url = this.request.url;
        const dir = __dirname + "/../../frontend/dist/";
        if(! url || url[url.length-1] === "/" || ! fs.existsSync(dir + url)) {
            if(!url.indexOf("?")&&path.parse(dir+url).ext)
            {
                return this.returnFourOFour();
            }
            url = "/index.html";
        }

        this.serveFile(dir+url);
    }

    serveFile(filename, andDelete) {
        this.response.setHeader('Content-Type', mime.lookup(filename));
        this.andDelete = andDelete;
        this.file = filename;
        fs.readFile(filename, this.fileRead.bind(this));
    }

    returnFourOFour()
    {
        this.response.statusCode = "404";
        this.response.end("File not found.");
    }

    fileRead(err, data)
    {
        if(err)
        {
            Log.debug("404!");
            return this.returnFourOFour();
        }
        //if(data.length<9999)
        //    console.log('file served', `${data}`);
        //Log.debug('file returned');
        this.response.end(data, 'binary', function(){
            if(this.andDelete) {
                fs.unlink(this.file, function () {
                    Log.info("delete", arguments, this.file);
                }.bind(this));
            }
        }.bind(this));
    }
}

//export RequestHandler;
module.exports = FileRequestHandler;
