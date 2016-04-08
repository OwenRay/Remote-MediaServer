/**
 * Created by owenray on 08-04-16.
 */
"use strict"
var guessit = require("guessit-wrapper");
var recursive = require('recursive-readdir');
var Settings = require("../Settings");

class MovieScanner
{

    scan(directory)
    {
        /*guessit.parseName("doctor_who_2005.6x03.the_curse_of_the_black_spot.720p_hdtv_x264-fov.mkv").then(function (data) {
            console.log(data);
        });*/
        recursive(Settings.moviesFolder, [this.willInclude], this.onListed);

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
        console.log(err, "have listed:");
        console.log(files);
    }
}

module.exports = MovieScanner;