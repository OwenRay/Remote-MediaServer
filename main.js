var MovieScanner = require("./backend/scanner/MovieScanner.js");
var HttpServer = require("./backend/HttpServer");

//new MovieScanner().scan();

new HttpServer().start();

