/**
 * Created by owenray on 08-04-16.
 */
"use strict";

var fs = require('fs');
var mime = require('mime');

var RequestHandler = require("./RequestHandler");

class FileRequestHandler extends RequestHandler{
    handleRequest()
    {
        //this.response.end("ok");
        var url = this.request.url;
        var dir = __dirname+"/../../frontend/dist/";
        if(! url || url[url.length-1] === "/" || ! fs.existsSync(dir + url)) {
            url = "/index.html";
        }

        this.response.setHeader('Content-Type', mime.lookup(url));
        fs.readFile(dir + url, "utf8", this.fileRead.bind(this));
    }

    fileRead(err, data)
    {
        if(err)
        {
            this.response.statusCode = "404";
            this.response.end("File not found.");
            return;
        }

        this.response.end(data);
    }
}

//export RequestHandler;
module.exports = FileRequestHandler;
