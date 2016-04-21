#!/usr/bin/env node
var spawnSync = require("child_process").spawnSync;
var addToExec = require("os").platform()=="win32"?".cmd":"";

process.chdir("frontend");

console.log("Building ember...");
var res = spawnSync("ember"+addToExec, ["build", "--env", "production"]);
console.log(`${res.stdout}`, `${res.stderr}`);