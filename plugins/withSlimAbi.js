const { withGradleProperties } = require('@expo/config-plugins');

/**
 * Ships native code for 64-bit ARM only.
 *
 * The default build packs four architectures into one APK: arm64-v8a,
 * armeabi-v7a, x86 and x86_64. The two x86 variants exist for emulators and
 * are dead weight on every real phone — together they were around 30 MB of a
 * 72 MB download. armeabi-v7a covers 32-bit devices, which have not shipped
 * since around 2016 and cannot run Free Fire anyway.
 *
 * Dropping all three roughly halves the download, which matters when players
 * are installing over mobile data.
 */
const ARCHITECTURES = 'arm64-v8a';

module.exports = function withSlimAbi(config) {
  return withGradleProperties(config, (cfg) => {
    const key = 'reactNativeArchitectures';
    const existing = cfg.modResults.find(
      (item) => item.type === 'property' && item.key === key,
    );
    if (existing) {
      existing.value = ARCHITECTURES;
    } else {
      cfg.modResults.push({ type: 'property', key, value: ARCHITECTURES });
    }
    return cfg;
  });
};
