const { withGradleProperties, withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Ships native code for 64-bit ARM only.
 *
 * The default build packs four architectures into one APK: arm64-v8a,
 * armeabi-v7a, x86 and x86_64. The two x86 variants exist for emulators and
 * are dead weight on every real phone — together they were around 26 MB of a
 * 72 MB download. armeabi-v7a covers 32-bit devices, which have not shipped
 * since around 2016 and cannot run Free Fire anyway.
 *
 * Two settings are needed, and only the second actually shrinks the APK:
 *
 *  - `reactNativeArchitectures` limits what React Native *compiles* from
 *    source. It speeds the build up but does not touch prebuilt libraries.
 *  - `ndk.abiFilters` filters at *packaging* time. Expo modules and other
 *    dependencies ship prebuilt .so files for all four ABIs inside their
 *    AARs, and those are copied into the APK regardless of what was compiled
 *    — so without this the x86 libraries stay in the download.
 */
const ABI = 'arm64-v8a';

module.exports = function withSlimAbi(config) {
  config = withGradleProperties(config, (cfg) => {
    const key = 'reactNativeArchitectures';
    const existing = cfg.modResults.find(
      (item) => item.type === 'property' && item.key === key,
    );
    if (existing) {
      existing.value = ABI;
    } else {
      cfg.modResults.push({ type: 'property', key, value: ABI });
    }
    return cfg;
  });

  return withAppBuildGradle(config, (cfg) => {
    const gradle = cfg.modResults.contents;
    if (gradle.includes('abiFilters')) return cfg;

    // Anchor on versionCode: it sits inside defaultConfig in the Expo
    // template, so the filter lands in the right block without parsing.
    const anchor = /(defaultConfig\s*\{[^]*?versionCode[^\n]*\n)/;
    if (!anchor.test(gradle)) {
      throw new Error(
        'withSlimAbi: could not find defaultConfig/versionCode in app/build.gradle',
      );
    }

    cfg.modResults.contents = gradle.replace(
      anchor,
      `$1        ndk {\n            abiFilters "${ABI}"\n        }\n`,
    );
    return cfg;
  });
};
