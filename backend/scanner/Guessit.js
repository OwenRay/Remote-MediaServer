"use strict";

module.exports = (function () {

    const http = require('http');
    const qs = require('querystring');
    const Q = require('q');
    const Settings = require('../Settings');

    function apiCall (path, query, post) {

        const deferred = Q.defer();

        let isPOST = (post === true);

        query = (query ? qs.stringify(query): '');

        if ( !isPOST) {
            path = path + (query.length ? '?' + query : '');
        }

        const options = {
            'hostname': Settings.getValue("guessit").host,
            'port': Settings.getValue("guessit").port,
            'path': path,
            'method': isPOST ? 'POST' : 'GET'
        };

        if (isPOST) {
            options.headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': query.length
            };
        }

        const req = http.request(options, function (res) {

            res.setEncoding('utf8');

            res.on('data', function (chunk) {
                deferred.resolve(JSON.parse(chunk));
            });
        });

        req.on('error', function (err) {
            deferred.reject(err);
        });

        if (isPOST) {
            req.write(query);
        }

        req.end();

        return deferred.promise;
    }

    function getVersion () {

        return apiCall('/guessit_version');
    }

    function parseName (filename, post) {

        return apiCall('/', {
            'filename': filename
        }, post);
    }

    function submitBug (filename) {

        return apiCall('/bugs', {
            'filename': filename
        }, true);
    }

    return {
        'apiCall': apiCall,
        'getVersion': getVersion,
        'parseName': parseName,
        'submitBug': submitBug
    };
})();
