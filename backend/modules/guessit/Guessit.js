const http = require('http');
const qs = require('querystring');
const Q = require('q');
const Settings = require('../../core/Settings');

class Guessit {
  static apiCall(path, query, post) {
    const deferred = Q.defer();

    const isPOST = (post === true);

    query = (query ? qs.stringify(query) : '');

    if (!isPOST) {
      path += (query.length ? `?${query}` : '');
    }

    const options = {
      hostname: Settings.getValue('guessit').host,
      port: Settings.getValue('guessit').port,
      path,
      method: isPOST ? 'POST' : 'GET',
    };

    if (isPOST) {
      options.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': query.length,
      };
    }

    const req = http.request(options, (res) => {
      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        deferred.resolve(JSON.parse(chunk));
      });
    });

    req.on('error', (err) => {
      deferred.reject(err);
    });

    if (isPOST) {
      req.write(query);
    }

    req.end();

    return deferred.promise;
  }

  static getVersion() {
    return this.apiCall('/guessit_version');
  }

  static parseName(filename, post) {
    return this.apiCall('/', {
      filename,
    }, post);
  }

  static submitBug(filename) {
    return this.apiCall('/bugs', {
      filename,
    }, true);
  }
}
module.exports = Guessit;
