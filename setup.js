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

if(npm(["-g", "ls", "bower"]).error)
{
    console.log("installing bower");
    npm(["install", "-g", "bower"]);
}
if(npm(["-g", "ls", "bower"]).error)
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


/*
Dit moet nog gebeuren in de main app...
if [ ! -f ffmpeg ];
then
if [ "$platform" = "unix64" ];
then
wget http://johnvansickle.com/ffmpeg/releases/ffmpeg-release-64bit-static.tar.xz
    tar -xf ffmpeg-*.tar.xz
cp -r ffmpeg-* /ffmpeg .
    cp -r ffmpeg-* /ffprobe .
    rm -r ffmpeg-*
chmod +x ffmpeg ffprobe
fi
if [ "$platform" = "osx" ];
then
wget http://www.ffmpegmac.net/resources/SnowLeopard_Lion_Mountain_Lion_Mavericks_Yosemite_El-Captain_25.02.2016.zip
    unzip SnowLeopard_Lion_Mountain_Lion_Mavericks_Yosemite_El-Captain_25.02.2016.zip
rm ffserver SnowLeopard_Lion_Mountain_Lion_Mavericks_Yosemite_El-Captain_25.02.2016.zip
fi

if [ "$platform" = "arm" ];
then
echo "!!!!!! Please install ffmpeg & ffprobe manually via your package manager"
fi
fi

echo "running node"
node main.js &

cd frontend
echo "running ember"
ember server --proxy http://localhost:8080/
*/