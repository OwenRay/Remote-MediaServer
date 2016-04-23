var MovieScanner = require("./backend/scanner/MovieScanner.js");
var HttpServer = require("./backend/HttpServer");

MovieScanner.scan();

new HttpServer().start();
