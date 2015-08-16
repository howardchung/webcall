var fs = require('fs');
var express = require('express');
var path = require('path');
var http = require('http');
var https = require('https');
var ExpressPeerServer = require('peer').ExpressPeerServer;
var pServers = {};
var options;
if (process.env.HTTPS) {
    options = {
        key: fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem')
    };
}
var app = express(options);
var server = process.env.HTTPS ? https.createServer(options, app).listen(process.env.HTTPS_PORT || 443) : http.createServer(app).listen(process.env.PORT || 5000);
app.use(function(req, res, next) {
    console.log(req.originalUrl);
    next();
});
app.use('/peerjs', express.static('./node_modules/peerjs/dist'));
app.use('/p/:room_id', function(req, res, next) {
    var room_id = req.params.room_id;
    if (!pServers[room_id]) {
        //TODO clean up servers after 24 hours
        pServers[room_id] = ExpressPeerServer(server, {
            path: room_id,
            debug: true,
            allow_discovery: true
        });
        pServers[room_id]._initializeHTTP();
        pServers[room_id]._setCleanupIntervals();
        pServers[room_id]._initializeWSS(server);
    }
    pServers[room_id](req, res);
});
app.use(function(req, res, next) {
    console.log('sending index page');
    res.sendFile(__dirname + "/public/index.html");
});
