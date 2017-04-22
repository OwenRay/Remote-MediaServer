"use strict";

const Settings = require("../Settings");
const Database = require("../Database");
const MediaItemHelper = require("../helpers/MediaItemHelper");
const fs = require("fs");
const Prom = require("node-promise").Promise;

const TheMovieDBExtendedInfo = require("./extendedInfo/TheMovieDBExtendedInfo");
const FFProbeExtendedInfo = require("./extendedInfo/FFProbeExtendedInfo");
const ParseFileNameExtendedInfo = require("./extendedInfo/ParseFileNameExtendedInfo");
const TheMovieDBSeriesAndSeasons = require("./extendedInfo/TheMovieDBSeriesAndSeasons");
const ExtrasExtendedInfo = require("./extendedInfo/ExtrasExtendedInfo");
const Log = require("../helpers/Log");

class MovieScanner
{

    constructor()
    {
        this.library = null;
        this.scanning = -1;
        this.scan();
        Settings.addObserver("libraries", this.scan.bind(this));
    }

    setScanTimeout()
    {
        if(this.scanTimeout) {
            clearTimeout(this.scanTimeout);
        }
        this.scanTimeout = setTimeout(this.scan.bind(this), Settings.getValue("scanInterval")*1000);
    }

    scan()
    {
        if(this.scanning!==-1)
        {
            Log.info("Scan in progress");
            return;
        }
        Log.info("start scanner");
        this.setScanTimeout();
        this.checkForMediaItemsWithMissingFiles();
        this.checkForMediaItemsWithMissingLibrary();
        this.scanNext();
    }

    checkForMediaItemsWithMissingFiles()
    {
        const items = Database.getAll("media-item");
        function next() {
            if(!items.length) {
                return;
            }
            fs.stat(MediaItemHelper.getFullFilePath(items[0]), function (err) {
                if (err) {
                    Log.info("item missing, removing", MediaItemHelper.getFullFilePath(items[0]), items[0].id);
                    Database.deleteObject("media-item", items[0].id);
                }
                items.shift();
                next();
            });
        }
        next();
    }

    checkForMediaItemsWithMissingLibrary()
    {
        const libraries = Settings.getValue("libraries");
        const libIds = [];
        for(let c = 0; c<libraries.length; c++)
        {
            libIds.push(libraries[c].uuid);
        }

        const items = Database.getAll("media-item");
        for(let c = 0; c<items.length; c++)
        {
            if(libIds.indexOf(items[c].attributes.libraryId)===-1)
            {
                Database.deleteObject("media-item", items[c].id);
            }
        }
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
        Log.info("start scan", this.library);

        this.getFilesFromDir(this.library.folder+"/")
            .then(this.checkForExtendedInfo.bind(this));
    }

    getFilesFromDir(dir) {
        const promise = new Prom();

        fs.readdir(dir, (err, files) => {
            if(err) {
                Log.warning("error dir listing", err);
                return;
            }
            this.procesFiles(dir, files).then(promise.resolve);
        });

        return promise;
    }

    procesFiles(dir, files) {
        const promise = new Prom();

        const next = function () {
            if (!files.length) {
                return promise.resolve();
            }
            const file = dir + files.pop();
            fs.stat(file, function (err, stats) {
                if (err) {
                    Log.warning("err stating " + file);
                    next();
                    return;
                }
                if (stats.isDirectory()) {
                    return this.getFilesFromDir(file + "/").then(next);
                }
                if (this.willInclude(file, stats)) {
                    this.addFileToDatabase(file);
                }
                next();
            }.bind(this));
        }.bind(this);
        next();
        return promise;
    }

    willInclude(file, fileRef)
    {
        if(fileRef.isDirectory()) {
            return false;
        }
        const f = file.split(".");
        const type = f[f.length - 1];
        for(let c = 0; c<this.types.length; c++) {
            if (this.types[c] === type) {
                return true;
            }
        }
        return false;
    }

    addFileToDatabase(file) {
        file = file.substr(this.library.folder.length);
        file = file.replace("\\", "/").replace("//", "/");
        file=this.library.folder.replace(/^(.*?)(\\|\/)?$/, "$1")+file;
        if(!Database.findBy("media-item", "filepath", file).length) {
            Log.info("found new file", file);
            const obj = {
                filepath: file,
                libraryId: this.library.uuid,
                mediaType: this.library.type,
                date_added: new Date().getTime()
            };
            if(file.match(/.*sample.*/)){
                obj.sample = obj.extra = true;
            }else if(file.match(/.*trailer.*/)){
                obj.sample = obj.extra = true;
            }
            Database.setObject("media-item", obj);
        }
    }

    checkForExtendedInfo()
    {
        Log.info("checking for extended info...");
        const items = Database.findBy("media-item", "libraryId", this.library.uuid);
        //order trailers and samples to the back
        let count = items.length;
        for(let c = 0; c<count; c++) {
            if(items[c].attributes.extra) {
                //console.log("isExtra", items[c]);
                items.push(items.splice(c, 1)[0]);
                count--;
                c--;
            }
        }

        const extendedInfoItems = [
            new FFProbeExtendedInfo(),
            new ParseFileNameExtendedInfo(),
            new TheMovieDBSeriesAndSeasons(),
            new TheMovieDBExtendedInfo(),
            new ExtrasExtendedInfo()
        ];

        const loadNext = function () {
            Log.debug("extendInfo, next");
            if (items.length === 0) {
                Log.info("done scanning");
                this.scanNext();
                return;
            }

            const item = items.pop();

            let prevPromise;
            for (let c = 0; c < extendedInfoItems.length; c++) {
                if (prevPromise) {
                    prevPromise = prevPromise.then(extendedInfoItems[c].extendInfo.bind(extendedInfoItems[c]));
                } else {
                    prevPromise = extendedInfoItems[c].extendInfo([item, this.library]);
                }
            }
            prevPromise.then(loadNext);

        }.bind(this);
        loadNext();
    }
}

//MovieScanner is a singleton!
module.exports = new MovieScanner();
