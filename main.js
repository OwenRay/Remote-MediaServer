var http = require('http');
var FileRequestHandler = require('./backend/requestHandlers/FileRequestHandler');
var ApiRequestHandler = require('./backend/requestHandlers/ApiRequestHandler');
var PlayRequestHandler = require('./backend/requestHandlers/PlayRequestHandler');
var Settings = require("./backend/Settings");
var MovieScanner = require("./backend/scanner/MovieScanner.js");

new MovieScanner().scan();

//Lets define a port we want to listen to
const PORT=Settings.port;

//We need a function which handles requests and send response
function handleRequest(request, response){
    var handlers = {
        api: ApiRequestHandler,
        ply: PlayRequestHandler,
        web: FileRequestHandler
    };
    var part = request.url.substr(1, 3);
    if(!handlers[part])
        part = "web";
    new handlers[part](request, response).handleRequest();
}



//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});
