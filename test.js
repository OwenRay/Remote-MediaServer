'use strict';

//////////////////////
// Greenlock Setup  //
//////////////////////

var greenlock = require('greenlock-koa').create({
  version: 'draft-11' // Let's Encrypt v2
  // You MUST change this to 'https://acme-v02.api.letsencrypt.org/directory' in production
  , server: 'https://acme-staging-v02.api.letsencrypt.org/directory'

  , email: 'jon@example.com'
  , agreeTos: true
  , approveDomains: [ 'example.com' ]

  // Join the community to get notified of important updates
  // and help make greenlock better
  , communityMember: true

  , configDir: require('os').homedir() + '/acme/etc'

 , debug: true
});


//////////////////
// Just add Koa //
//////////////////

var http = require('http');
var https = require('https');
var koa = require('koa');
var app = new koa();
var ssl = require('koa-sslify').default;

app.use(function *() {
  this.body = 'Hello World';
});

// https server
var server = https.createServer(greenlock.tlsOptions, greenlock.middleware(app.callback()));

server.listen(8443, function () {
  console.log('Listening at https://localhost:' + this.address().port);
});


// http redirect to https
/*var http = require('http');
var redirectHttps = app.use(ssl()).callback();
http.createServer(greenlock.middleware(redirectHttps)).listen(8234, function () {
  console.log('Listening on port 80 to handle ACME http-01 challenge and redirect to https');
});
*/
