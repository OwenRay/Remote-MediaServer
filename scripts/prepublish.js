#!/usr/bin/env node
var spawnSync = require("child_process").spawnSync;
var addToExec = require("os").platform()=="win32"?".cmd":"";

process.chdir("frontend");

console.log("Building react...");
var res = spawnSync("npm"+addToExec, ["run", "build"]);
console.log(`${res.stdout}`, `${res.stderr}`);
