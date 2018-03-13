const chokidar = require('chokidar');
const Log = require('../helpers/Log');

Log.debug('started filewatch worker for:', process.argv[2]);
chokidar.watch(
  process.argv[2],
  { ignoreInitial: true, usePolling: false, awaitWriteFinish: true },
).on('all', (type, file) => {
  process.send(file);
});
