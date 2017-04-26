/**
 * Created by owenray on 08-04-16.
 */
"use strict";

class RequestHandler {
    /**
     *
     * @param method
     * @param path
     * @param context
     */
    constructor(method, path, context)
    {
        console.log(arguments);
        this.context = context;
        this.request = this.context.request;
        this.response = this.context.response;
        console.log(this);
        this.path = path;
    }

    /**
     *
     * @returns {boolean|Promise} did you consume the request?
     */
    handleRequest()
    {
        return false;
    }
}

module.exports = RequestHandler;