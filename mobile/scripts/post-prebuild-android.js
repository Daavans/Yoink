#!/usr/bin/env node
// Applied after `expo prebuild --platform android` to fix pnpm monorepo issues.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mobileDir = path.join(__dirname, '..');
const androidDir = path.join(mobileDir, 'android');

function patch(filePath, search, replace) {
  if (!fs.existsSync(filePath)) {
    console.log(`[skip] File not found: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes(search)) {
    console.log(`[skip] Already patched: ${path.relative(mobileDir, filePath)}`);
    return;
  }
  content = content.replace(search, replace);
  fs.writeFileSync(filePath, content);
  console.log(`[patched] ${path.relative(mobileDir, filePath)}`);
}

// 1. Downgrade Gradle wrapper from 8.8 to 8.3 (expo-modules-core@1.12 incompatible with 8.8)
patch(
  path.join(androidDir, 'gradle/wrapper/gradle-wrapper.properties'),
  'gradle-8.8-all.zip',
  'gradle-8.3-all.zip'
);

// 2. Increase JVM heap for Gradle daemon (needed for Hermes transform)
patch(
  path.join(androidDir, 'gradle.properties'),
  'org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m',
  'org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m'
);

// 3. Write local.properties with Android SDK path
const localProps = path.join(androidDir, 'local.properties');
const sdkPath = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME || '';
if (sdkPath && !fs.existsSync(localProps)) {
  const escaped = sdkPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
  fs.writeFileSync(localProps, `sdk.dir=${escaped}\n`);
  console.log(`[written] android/local.properties (sdk.dir=${sdkPath})`);
}

// 4. Patch expo-modules-core: fix components.release for AGP 8.x
// 5. Patch expo-modules-core: shorter CMake staging dir (fixes Windows 260-char path limit)
try {
  // Find expo-modules-core in the pnpm virtual store
  const pnpmStore = path.join(mobileDir, '..', 'node_modules', '.pnpm');
  const storeEntries = fs.readdirSync(pnpmStore).filter(d => d.startsWith('expo-modules-core@'));
  if (!storeEntries.length) throw new Error('expo-modules-core not found in pnpm store');
  const emcStoreDir = path.join(pnpmStore, storeEntries[0], 'node_modules', 'expo-modules-core');
  const emcAndroid = path.join(emcStoreDir, 'android');

  patch(
    path.join(emcAndroid, 'ExpoModulesCorePlugin.gradle'),
    '          from components.release',
    "          from components.findByName('release')"
  );

  patch(
    path.join(emcAndroid, 'build.gradle'),
    '  externalNativeBuild {\n    cmake {\n      path "CMakeLists.txt"\n    }',
    '  externalNativeBuild {\n    cmake {\n      path "CMakeLists.txt"\n      buildStagingDirectory "${rootProject.buildDir}/emodc"\n    }'
  );
} catch (e) {
  console.warn('[warn] Could not find expo-modules-core:', e.message);
}

console.log('\n[done] post-prebuild patches applied');
