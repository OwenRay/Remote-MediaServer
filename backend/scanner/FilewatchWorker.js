const chokidar = require('chokidar');
const Log = require('../helpers/Log');

const watcherType = process.argv[3];
const options = {
  ignoreInitial: true,
  usePolling: watcherType === 'polling',
  awaitWriteFinish: {
    stabilityThreshold: 6000,
    pollInterval: 100,
  },
  useFsEvents: watcherType === 'native',
};

Log.debug(`started ${process.argv[3]} filewatch worker for:`, process.argv[2]);
chokidar.watch(
  process.argv[2],
  options,
).on('all', (type, file) => {
  Log.debug('worker found file', file);
  process.send(file);
});
