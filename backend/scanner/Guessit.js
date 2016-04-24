module.exports = (function () {

    var http = require('http');
    var qs   = require('querystring');
    var Q    = require('q');

    function apiCall (path, query, post) {

        var deferred = Q.defer();

        var isPOST = (post === true);

        query = (query ? qs.stringify(query): '');

        if ( !isPOST) {
            path = path + (query.length ? '?' + query : '');
        }

        var options = {
            'hostname': '52.17.159.194',
            'port': 5000,
            'path': path,
            'method': isPOST ? 'POST' : 'GET'
        };

        if (isPOST) {
            options.headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': query.length
            };
        }

        var req = http.request(options, function (res) {

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
