/**
 * Created by owenray on 08-04-16.
 */
"use strict";

class RequestHandler {
    /**
     *
     * @param {http.ClientRequest} request
     * @param {http.ServerResponse} response
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

//export RequestHandler;
module.exports = RequestHandler;