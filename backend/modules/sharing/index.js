const fs = require('fs');

if (!fs.existsSync('share')) {
  fs.mkdirSync('share');
}

require('./TcpServer');
require('./FileProcessor');
require('./DatabaseFetcher');
require('./EDHT');
require('./DownloadFileHandler');
