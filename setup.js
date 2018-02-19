// THIS IS A LITTLE SCRIPT TO CHECK FOR AND INSTALL DEPENDENCIES...
var os = require("os");
var spawnSync = require("child_process").spawnSync;
var path = require("path");

console.log("running on platform:", os.platform());
var addToExec = os.platform()=="win32"?".cmd":"";

function npm(args)
{
    var cmd = "npm"+addToExec;
    return spawnSync(cmd, args);
}

process.chdir("frontend");
console.log("installing frontend dependencies");
var data = npm(["install"]);
console.log(`${data.stdout}`, `${data.stderr}`);

process.chdir("../");
console.log("installing backend dependencies");
data = npm(["install"]);
console.log(`${data.stdout}`, `${data.stderr}`);
