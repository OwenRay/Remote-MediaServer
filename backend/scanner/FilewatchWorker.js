const chokidar = require('chokidar');
const Log = require('../helpers/Log');

Log.debug('started filewatch worker for:', process.argv[2]);
chokidar.watch(
  process.argv[2],
  {
    ignoreInitial: true,
    usePolling: false,
    awaitWriteFinish: true,
    useFsEvents: true,
  },
).on('all', (type, file) => {
  Log.debug('worker found file', file);
  process.send(file);
});
