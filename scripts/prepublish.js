#!/usr/bin/env node
const spawnSync = require('child_process').spawnSync;
const addToExec = require('os').platform() == 'win32' ? '.cmd' : '';

process.chdir('frontend');

console.log('Building react...');
let res = spawnSync(`npm${addToExec}`, ['install']);
console.log(`${res.stdout}`, `${res.stderr}`);
res = spawnSync(`npm${addToExec}`, ['run', 'build', '--environment=production']);
console.log(`${res.stdout}`, `${res.stderr}`);
