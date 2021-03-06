var fs = require("fs");
var path = require("path");
var url = require("url");
var querystring = require("querystring");
var exec = require("child_process").exec;

function start(response) {
    console.log('starting');
    var filename = path.join(process.cwd(), 'www/index.html');

    fs.exists(filename, function(exists) {
        response.writeHead(200, {'Content-Type': 'text/html'});
        var fileStream = fs.createReadStream(filename);
        fileStream.pipe(response);
    });
}

function getTalks(response) {
    console.log('gettingMovies');

    exec("find www/videos/sdc/SDC2013/ -type f -name *.mp4", function (error, stdout, stderr) {

        var lines = stdout.toString().split('\n');
        var results = [];
        lines.forEach(function(line) {
            results.push({type: 'sdc', path: line});
        });

        response.writeHead(200, {"Content-Type": "application/json"});
        response.write(JSON.stringify(results));
        response.end();
    });
}

function getCategories(response) {
    console.log('get categories invoked');

    exec("find www/videos -maxdepth 1 -type d", function (error, stdout, stderr) {
        var lines = stdout.toString().replace(new RegExp("www/videos/?","g"),"").split('\n');
        var categories = [];
        lines.forEach(function (line) {
            if (line != '') {
                categories.push(line);
            }
        });

        response.writeHead(200, {"Content-Type": "application/json"});
        response.write(JSON.stringify(categories));
        response.end();
    });
}

function getSubcategories(response, request) {
    console.log('get subcategories invoked');

    var query = url.parse(request.url).query;
    var category = querystring.parse(query).category;
    if (category === undefined) {
        response.writeHead(400, {'Content-Type': 'text/html'});
        response.end;
    }
    console.log('getting subcategories for category ' + category);

    var searchRoot = "www/videos/" + category;
    exec("find " + searchRoot + " -maxdepth 1 -type d", function (error, stdout, stderr) {
        var lines = stdout.toString().replace(new RegExp(searchRoot + "/?","g"),"").split('\n');
        var subcategories = [];
        lines.forEach(function (line) {
            if (line != '') {
                subcategories.push(line);
            }
        });

        response.writeHead(200, {"Content-Type": "application/json"});
        response.write(JSON.stringify(subcategories));
        response.end();
    });
}

function notFound(response) {
    console.log('resource not found');
    var filename = path.join(process.cwd(), 'www/404.html');

    fs.exists(filename, function(exists) {
        response.writeHead(404, {'Content-Type': 'text/html'});
        var fileStream = fs.createReadStream(filename);
        fileStream.pipe(response);
    });
}

function stream(response, request) {
    console.log('streaming invoked');

    var query = url.parse(request.url).query;
    var pathToVideo = querystring.parse(query).path;
    console.log('desired video is ' + pathToVideo);
    var filename = path.join(process.cwd(), pathToVideo);

    var stat = fs.statSync(filename);
    var total = stat.size;

    if (request.headers.range) {
        var range = request.headers.range;
        var parts = range.replace(/bytes=/, "").split("-");
        var partialstart = parts[0];
        var partialend = parts[1];

        var start = parseInt(partialstart, 10);
        var end = partialend ? parseInt(partialend, 10) : total-1;
        var chunksize = (end-start)+1;
        console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);

        var file = fs.createReadStream(filename, {start: start, end: end});
        response.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' });
        file.pipe(response);
    } else {
        console.log('ALL: ' + total);
        response.writeHead(200, { 'Content-Length': total, 'Content-Type': 'video/mp4' });
        fs.createReadStream(filename).pipe(response);
    }
}

exports.start = start;
exports.getTalks = getTalks;
exports.notFound = notFound;
exports.stream = stream;
exports.getCategories = getCategories;
exports.getSubcategories = getSubcategories;
