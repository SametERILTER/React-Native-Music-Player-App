const util = require('util');
if (!util.styleText) {
  util.styleText = (format, text) => text;
}

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
