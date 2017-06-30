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

if(npm(["-g", "ls", "bower"]).status)
{
    console.log("installing bower");
    npm(["install", "-g", "bower"]);
}
if(npm(["-g", "ls", "ember-cli"]).status)
{
    console.log("installing ember");
    npm(["install", "-g", "ember-cli"]);
}

console.log("installing backend dependencies");
var data = npm(["install"]);
console.log(`${data.stdout}`, `${data.stderr}`);

process.chdir("frontend");
console.log("installing frontend dependencies (this can take some time)");
data = npm(["install"]);
console.log(`${data.stdout}`, `${data.stderr}`);
data = spawnSync("bower"+addToExec, ["install"]);
console.log(`${data.stdout}`, `${data.stderr}`);

console.log("Building frontend");
data = spawnSync("ember"+addToExec, ["build", "--environment=production"]);
console.log(`${data.stdout}`, `${data.stderr}`);
