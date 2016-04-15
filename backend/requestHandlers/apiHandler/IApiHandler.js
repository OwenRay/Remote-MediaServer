/**
 * Created by owen on 14-4-2016.
 */
"use strict";

class IApiHandler
{
    /**
     *
     * @returns {boolean} handled or not?
     */
    handle(request, response)
    {
       return false;
    }
}

module.exports = IApiHandler;