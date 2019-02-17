#!/usr/bin/env node
const fs = require('fs');

const dir = `${process.env.HOME || process.env.USERPROFILE}/.remote`;
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

// make sure all settings files are in the right directory
process.chdir(dir);

require('./backend/core').init();
