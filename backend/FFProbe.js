/**
 * Created by Cole on 10-4-2016.
 */
var spawn = require('child_process').spawn;
var Promise = require("node-promise").Promise;
var Settings = require("./Settings");
var Debug = require("./helpers/Debug")

var FFProbe =
{
    getInfo(fileName)
    {
        var promise = new Promise();

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
            Debug.info("ffprobe result:", `${data}`);
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
    },

    getNearestKeyFrame(fileName, position)
    {
        var promise = new Promise();

        Debug.debug(Settings.getValue("ffprobe_binary"), fileName);
        var proc = spawn(
            Settings.getValue("ffprobe_binary"),
            [
                "-v", "quiet",
                "-read_intervals", position+"%+#1",
                "-show_frames",
                "-select_streams", "v:0",
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
            Debug.debug("got nearest key frame", `${data}`);
        });
        proc.on("close", function()
        {
            try{
                data = JSON.parse(returnData);
                data = data.frames[0];
                promise.resolve(parseFloat(data.pkt_pts_time)-parseFloat(data.pkt_duration_time)*2);
                //promise.resolve(position);
            }catch(e){
                promise.reject(e);
            }
        });
        return promise;
    }
};

module.exports = FFProbe;
