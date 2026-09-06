const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// The Parse SDK requires Node's `crypto` for randomUUID, which Metro cannot
// resolve. Point it at a small expo-crypto-backed shim instead.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  crypto: path.resolve(__dirname, 'shims/crypto.js'),
};

module.exports = config;
