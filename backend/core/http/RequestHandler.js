/* eslint-disable class-methods-use-this */
/**
 * Created by owenray on 08-04-16.
 */


class RequestHandler {
  /**
     *
     * @param method
     * @param path
     * @param context
     */
  constructor(context, method, path) {
    this.method = method;
    this.path = path;
    this.context = context;
    if (this.context) {
      this.request = this.context.request;
      this.response = this.context.response;
    }
    this.path = path;
  }

  /**
     *
     * @returns {boolean|Promise} did you consume the request?
     */
  handleRequest() {
    return false;
  }

  static getDescription() {
    return '';
  }
}

module.exports = RequestHandler;
