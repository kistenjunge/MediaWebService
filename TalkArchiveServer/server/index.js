var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers.js");

var handle = {};
handle['/'] = requestHandlers.start;
handle['/talks'] = requestHandlers.getTalks;
handle['/404'] = requestHandlers.notFound;
handle['/stream'] = requestHandlers.stream;

server.start(router.route, handle);
