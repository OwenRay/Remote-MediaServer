/**
 * Created by owenray on 08-04-16.
 */
"use strict";

class RequestHandler {
    /**
     *
     * @param {IncomingMessage} request
     * @param {ServerResponse} response
     */
    constructor(request, response)
    {
        this.request = request;
        this.response = response;
    }

    handleRequest()
    {

    }
}

module.exports = RequestHandler;