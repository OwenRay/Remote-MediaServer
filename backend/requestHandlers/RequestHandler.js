/**
 * Created by owenray on 08-04-16.
 */
"use strict";

class RequestHandler {
    /**
     *
     * @param {Context} context
     */
    constructor(method, path, context)
    {
        console.log(arguments);
        this.context = context;
        this.request = this.context.req;
        this.response = this.context.res;
        this.path = path;
    }

    handleRequest()
    {

    }
}

module.exports = RequestHandler;