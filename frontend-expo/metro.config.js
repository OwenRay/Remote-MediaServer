// Custom Metro config for Expo to ignore test/spec files during app bundling
// This prevents files like *.spec.tsx in the app directory from being treated
// as routes or included by the bundler when running `expo start`.

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('metro-config').ConfigT} */
const config = getDefaultConfig(__dirname);

// Ignore any unit test files from being resolved by Metro
// This covers .spec, .test in js/ts/tsx/mjs/cjs formats
const TEST_FILES_REGEX = /(^|\/)__tests__(\/|$)|\.(spec|test)\.[mc]?[jt]sx?$/;

config.resolver = {
  ...config.resolver,
  // Use a single RegExp directly; no need for metro-config's exclusionList helper
  blockList: TEST_FILES_REGEX,
};

module.exports = config;
