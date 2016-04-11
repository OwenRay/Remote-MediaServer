/**
 * Created by owenray on 08-04-16.
 */
"use strict"
var guessit = require("guessit-wrapper");
var recursive = require('recursive-readdir');
var Settings = require("../Settings");
var path = require('path');
var Database = require("../Database");
var MovieDB = require('moviedb')('0699a1db883cf76d71187d9b24c8dd8e');

class MovieScanner
{

    scan(directory)
    {
        recursive(Settings.moviesFolder, [this.willInclude], this.onListed.bind(this));

    }

    willInclude(file, fileRef)
    {
        if(fileRef.isDirectory())
            return false;

        var f = file.split(".");
        var type =  f[f.length-1];
        for(var c = 0; c<Settings.videoFileTypes.length; c++) {
            if (Settings.videoFileTypes[c] === type) {
                return false;
            }
        }
        return true;
    }

    onListed(err, files)
    {
        if(err)
        {
            return;
        }
        var offset = -1;
        var loadNext = function ()
        {
            offset++;
            if(!files[offset]) {
                this.checkForExtendedInfo();
                return;
            }
            var relativePath = files[offset].substr(Settings.moviesFolder.length);
            if(Database.findBy("media-item", "filepath", relativePath).length!=0) {
                return loadNext();
            }

            var filePath = path.parse(files[offset]);
            var folder = path.parse(filePath.dir);

            console.log("find", folder.base + "-" + filePath.base);
            function errorFunction()
            {
                console.log("Fail");
                guessit.parseName(folder.base + "-" + filePath.base).then(function (data) {
                    console.log("hier", data);
                    if(!data.title)
                        return loadNext();
                    data.filepath = relativePath;
                    console.log("b");
                    Database.setObject("media-item", data);
                    console.log("suc6");
                    loadNext();
                }, function()
                {
                    console.log("andfail");
                    loadNext();
                });
            }

            guessit.parseName(filePath.base).then(function (data) {
                if(!data.title)
                    return errorFunction();
                data.filepath = relativePath;
                Database.setObject("media-item", data);
                loadNext();
            }, errorFunction);
        }.bind(this);
        loadNext();
    }

    checkForExtendedInfo()
    {
        console.log("checking for extended info...");
        var items = Database.getAll("media-item");
        function loadNext()
        {
            if(items.length==0)
                return;

            var item = items.pop();
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
                                console.log("extended");
                                Database.update("media-item", item);
                            }
                            console.log("got Extended attrs on", item.attributes.title);
                        }else{
                            console.log(err);
                        }
                        setTimeout(loadNext, 300);
                    });
            }else{
                loadNext();
            }
        }
        loadNext();
    }
}

module.exports = MovieScanner;