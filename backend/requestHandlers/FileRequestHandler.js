/**
 * Created by owenray on 08-04-16.
 */
"use strict";

var fs = require('fs');
var mime = require('mime');
var path = require('path');
var Debug = require("../helpers/Debug");

var RequestHandler = require("./RequestHandler");

class FileRequestHandler extends RequestHandler{
    handleRequest()
    {
        //this.response.end("ok");

        var url = this.request.url;
        var dir = __dirname+"/../../frontend/dist/";
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
            Debug.debug("404!");
            return this.returnFourOFour();
        }
        //if(data.length<9999)
        //    console.log('file served', `${data}`);
        //Debug.debug('file returned');
        this.response.end(data, 'binary', function(){
            if(this.andDelete)
                fs.unlink(this.file, function(){
                    console.log("delete", arguments, this.file);

                }.bind(this));
        }.bind(this));
    }
}

//export RequestHandler;
module.exports = FileRequestHandler;
