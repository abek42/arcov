var https = require('https');
var fs = require('fs');
var express = require('express');

var options = {
    key: fs.readFileSync( './certs/localhost.key' ),
    cert: fs.readFileSync( './certs/localhost.cert' ),
    requestCert: false,
    rejectUnauthorized: false
};

var app = express();

app.use('/',express.static("app"));
var port = process.env.PORT || 443;
var server = https.createServer( options, app );

server.listen( port, function () {
    console.log( 'Express server listening on port ' + server.address().port );
} );

