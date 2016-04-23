#!/usr/bin/env node
require("./scripts/onrun.js")
var fs = require("fs");

var dir = process.env.HOME || process.env.USERPROFILE;
dir += "/.remote/"
if(!fs.existsSync(dir))
{
    fs.mkdirSync(dir);
}

//make sure all settings files are in the right directory
console.log("chdir", dir);
process.chdir(dir);

var MovieScanner = require("./backend/scanner/MovieScanner.js");
var HttpServer = require("./backend/HttpServer");

new MovieScanner().scan();

new HttpServer().start();
