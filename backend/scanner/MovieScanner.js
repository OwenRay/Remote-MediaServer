"use strict";

var guessit = require("./Guessit");
var recursive = require('recursive-readdir');
var Settings = require("../Settings");
var Database = require("../Database");
var TheMovieDBExtendedInfo = require("./extendedInfo/TheMovieDBExtendedInfo");
var FFProbeExtendedInfo = require("./extendedInfo/FFProbeExtendedInfo");


class MovieScanner
{

    constructor()
    {
        this.scanning = -1;
        this.library = null;
        Settings.addObserver("libraries", this.scan.bind(this));
    }

    scan()
    {
        if(this.scanning!=-1)
        {
            return;
        }
        this.scanNext();
    }

    scanNext()
    {
        this.scanning++;
        if(this.scanning>=Settings.getValue("libraries").length)
        {
            this.scanning = -1;
            return;
        }

        this.types = Settings.getValue("videoFileTypes");
        this.library = Settings.getValue("libraries")[this.scanning];
        recursive(this.library.folder, [this.willInclude.bind(this)], this.onListed.bind(this));
    }

    willInclude(file, fileRef)
    {
        if(fileRef.isDirectory())
            return false;
        var f = file.split(".");
        var type =  f[f.length-1];
        for(var c = 0; c<this.types.length; c++) {
            if (this.types[c] === type) {
                return false;
            }
        }
        return true;
    }

    onListed(err, files)
    {
        if(err)
        {
            // console.log(err);
            return;
        }
        console.log("gotAllFiles");
        var offset = -1;
        var loadNext = function ()
        {
            offset++;
            if(!files[offset]) {
                this.checkForExtendedInfo();
                return;
            }
            var relativePath = files[offset].substr(this.library.folder.length);
            if(Database.findBy("media-item", "filepath", relativePath).length!=0) {
                return loadNext();
            }

            var filePath = path.parse(files[offset]);
            var folder = path.parse(filePath.dir);

            var errorFunction = function ()
            {
                 console.log("Fail");
                guessit.parseName(folder.base.replace(/ /g, '.') + "-" + filePath.base.replace(/ /g, '.'), {options:"-t movie"}).then(function (data) {
                    console.log(data);
                    if(data.title) {
                        data.title = data.title.replace(folder.base + '-', '');
                    }
                    this.applyGuessitData(data, relativePath);
                    loadNext();
                }.bind(this), function()
                {
                     console.log("andfail");
                    loadNext();
                });
            }.bind(this);

            guessit.parseName(filePath.base.replace(/ /g, '.'), {options:"-t movie"}).then(function (data) {
                console.log(data);
                if(this.applyGuessitData(data, relativePath)) {
                    return loadNext();
                }
                errorFunction();
            }.bind(this), errorFunction);
        }.bind(this);
        loadNext();
    }

    applyGuessitData(data, relativePath)
    {
        if(!data.title) {
            //console.log("no title", data);
            return false;
        }
        data.libraryId = this.library.uuid;
        data.mediaType = this.library.type;
        data.filepath = relativePath;
        Database.setObject("media-item", data);
        return true;
    }

    checkForExtendedInfo()
    {
        // console.log("checking for extended info...");
        var items = Database.getAll("media-item");

        var extendedInfoItems = [new TheMovieDBExtendedInfo(), new FFProbeExtendedInfo()];

        var loadNext = function()
        {
            console.log("extendInfo, next");
            if(items.length === 0) {
                console.log("done scanning");
                this.scanNext();
                return;
            }

            var item = items.pop();

            var prevPromise;
            for(var c = 0; c<extendedInfoItems.length; c++)
            {
                console.log("prevPromise", prevPromise);
                if(!prevPromise)
                {
                    prevPromise = extendedInfoItems[c].extendInfo([item, this.library]);
                }else{
                    prevPromise = prevPromise.then(extendedInfoItems[c].extendInfo.bind(extendedInfoItems[c]));
                }
            }
            prevPromise.then(loadNext);

        }.bind(this);
        loadNext();
    }
}

//MovieScanner is a singleton!
module.exports = new MovieScanner();
