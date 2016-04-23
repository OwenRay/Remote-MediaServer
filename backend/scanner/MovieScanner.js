"use strict"

var guessit = require("guessit-wrapper");
var recursive = require('recursive-readdir');
var Settings = require("../Settings");
var path = require('path');
var Database = require("../Database");
var MovieDB = require('moviedb')('0699a1db883cf76d71187d9b24c8dd8e');
var FFProbe = require('../FFProbe');

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
            // console.log("Scan in progress");
            return;
        }

        // console.log("start scanner");
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
        // console.log("gotAllFiles");
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
                // return loadNext();
            }

            var filePath = path.parse(files[offset]);
            var folder = path.parse(filePath.dir);

            // console.log('here', relativePath);
            // console.log("find", folder.base + "-" + filePath.base);
            var errorFunction = function ()
            {
                // console.log("Fail");
                guessit.parseName(folder.base + "-" + filePath.base.replace(/ /g, '.') + '&type=movie').then(function (data) {
                    data.title = data.title.replace(folder.base + '-', '');
                    this.applyGuessitData(data, relativePath);
                    loadNext();
                }.bind(this), function()
                {
                    // console.log("andfail");
                    loadNext();
                });
            }.bind(this);

            guessit.parseName(filePath.base.replace(/ /g, '.') + '&type=movie').then(function (data) {
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
            // console.log("no title", data);
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
        var loadNext = function()
        {
            if(items.length === 0) {
                this.scanNext();
                return;
            }

            var item = items.pop();
            var delayed = this.checkFileInfo(item);
            if(!item.attributes.gotExtendedInfo)
            {
                MovieDB.searchMovie(
                    {query:item.attributes.title, year:item.attributes.year},
                    function(err, res){
                        if(!err) {
                            res = res.results[0];
                            if (res) {
                                for (var key in res) {
                                    item.attributes[key.replace("_", "-")] = res[key];
                                }
                                item.attributes.gotExtendedInfo = true;
                                // console.log("extended");
                                Database.update("media-item", item);
                            }
                            // console.log("got Extended attrs on", item.attributes.title);
                        }else{
                            // console.log(err);
                        }
                        setTimeout(loadNext, 300);
                    });
            }else{
                if(delayed)
                    setTimeout(loadNext, 300);
                else
                    loadNext();
            }
        }.bind(this);
        loadNext();
    }

    checkFileInfo(obj)
    {
        if(obj.attributes.gotfileinfo)
            return false;

        var file = decodeURI(this.library.folder+obj.attributes.filepath);
        FFProbe.getInfo(file)
            .then(function(fileData)
            {
                if(!fileData||!fileData.format)
                    return;
                obj.attributes.fileduration = parseFloat(fileData.format.duration);
                obj.attributes.filesize = parseInt(fileData.format.size);
                obj.attributes.bitrate = fileData.format.bit_rate;
                obj.attributes.gotfileinfo = true;
                Database.update("media-item", obj);
            });
        return true;
    }
}

//MovieScanner is a singleton!
module.exports = new MovieScanner();
