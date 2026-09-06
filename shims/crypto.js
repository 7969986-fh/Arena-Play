/**
 * Minimal `crypto` stand-in for React Native.
 *
 * The Parse SDK's react-native build does `require('crypto').randomUUID`, but
 * Node's crypto module does not exist in Metro's runtime. expo-crypto is a
 * native module that provides exactly that, so we alias `crypto` to this file
 * from metro.config.js.
 */
const { randomUUID, getRandomValues } = require('expo-crypto');

module.exports = { randomUUID, getRandomValues };
