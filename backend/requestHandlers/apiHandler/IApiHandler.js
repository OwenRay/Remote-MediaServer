/**
 * Created by owen on 14-4-2016.
 */
"use strict";

class IApiHandler
{

    /**
     *
     * @param {IncomingMessage} request
     * @param {ServerResponse} response
     * @param {url} url
     * @returns {boolean} handled or not?
     */
    handle(request, response, url)
    {
       return false;
    }
}

module.exports = IApiHandler;