/**
 * Created by Cole on 10-4-2016.
 */
var spawn = require('child_process').spawn;
var Promise = require("node-promise").Promise;
var Settings = require("./Settings");

var FFProbe =
{
    getInfo(fileName)
    {
        console.log("hier");
        var promise = new Promise();

        var proc = spawn(
                    Settings.ffprobe_binary,
                    [
                        "-v", "quiet",
                        "-show_format",
                        "-show_streams",
                        "-print_format", "json",
                        fileName,
                    ]
                );
        var returnData = "";
        proc.stdout.on('data', function(data)
        {
            returnData+=`${data}`;
        });
        proc.stderr.on('data', function(data)
        {
            promise.reject(`${data}`);
            console.log(`${data}`);
        });
        proc.on("close", function()
        {
            try{
                promise.resolve(JSON.parse(returnData));
            }catch(e){
                promise.reject(e);
            }
        });
        return promise;
    }
};

module.exports = FFProbe;
