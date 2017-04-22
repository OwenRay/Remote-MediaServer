/**
 * Created by owenray on 18-4-2016.
 */
"use strict";
const IApiHandler = require("./IApiHandler");
const querystring = require("querystring");
const fs = require("fs");

class DirectoryBrowserHandler extends IApiHandler
{
    handle(request, response, url)
    {
        if(url.pathname!=="/api/browse")
        {
            return false;
        }

        const query = querystring.parse(url.query);
        if(!query.directory) {
            query.directory = "/";
        }
        if(query.directory[query.directory.length-1]!=="/") {
            query.directory += "/";
        }

        fs.readdir(
            query.directory,
            this.onDirectoryList.bind([query.directory, response]));
        return true;
    }

    onDirectoryList(err, result)
    {
        const directory = this[0];
        const response = this[1];
        if(err)
        {
            return response.end(JSON.stringify({"error":err}));
        }

        let pos = 0;

        //function to loop over files to see if they are directories
        function stat(err, res)
        {
            if(res||err)
            {
                if(res&&res.isDirectory()) //is the file a directory? move along
                {
                    pos++;
                }else{// file is not a directory remove from the results
                    result.splice(pos, 1);
                }

                if(pos===result.length)//all files processed, return result
                {
                    return response.end(JSON.stringify({"result":result}));
                }
            }
            fs.stat(directory+result[pos], stat);
        }
        stat();

    }
}

module.exports = DirectoryBrowserHandler;