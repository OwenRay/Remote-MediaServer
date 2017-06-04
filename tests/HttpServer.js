var server = require("../backend/HttpServer");
var http = require("http");
require("../scripts/onrun.js");

module.exports = {
    setUp(callback)
    {
        server.start();
        setTimeout(callback, 1000);
    },

    testConnection(test)
    {
        test.expect(1);
        http.get("http://localhost:8080/index.html", function(res){
            test.strictEqual(res.statusCode, 200);
            test.done();
        });
    },

    tearDown(callback)
    {
        server.stop();
        callback();
    }
};