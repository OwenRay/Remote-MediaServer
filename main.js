#!/usr/bin/env node
"use strict";
require("./scripts/onrun.js");
const fs = require("fs");

let dir = process.env.HOME || process.env.USERPROFILE;
dir += "/.remote/";
if(!fs.existsSync(dir))
{
    fs.mkdirSync(dir);
}

//make sure all settings files are in the right directory
console.log("chdir", dir);
process.chdir(dir);

require("./backend/scanner/MovieScanner.js");
require("./backend/HttpServer").start();