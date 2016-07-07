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
        var promise = new Promise();

        console.log(Settings.getValue("ffprobe_binary"), fileName);
        var proc = spawn(
                    Settings.getValue("ffprobe_binary"),
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
