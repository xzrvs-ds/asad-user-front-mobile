/**
 * Patch @capacitor/android to avoid compile-time references to Android 15 (API 35) symbols
 * and fix Java version compatibility issues.
 *
 * Why:
 * - Appflow runner SDK 35 android.jar appears broken (aapt2 can't load it)
 * - But Capacitor v7 references API 35-only symbols in CapacitorWebView.java
 * - We build against compileSdk=34 and use runtime checks + reflection instead.
 * - Capacitor v7.4.4 uses Java 21, but Gradle 7.5.1 doesn't support it
 * - We need to patch both Java files and build.gradle files to use Java 17
 */
const fs = require('fs');
const path = require('path');

const javaFile = path.join(
  __dirname,
  '..',
  'node_modules',
  '@capacitor',
  'android',
  'capacitor',
  'src',
  'main',
  'java',
  'com',
  'getcapacitor',
  'CapacitorWebView.java'
);

const buildGradleFile = path.join(
  __dirname,
  '..',
  'node_modules',
  '@capacitor',
  'android',
  'capacitor',
  'build.gradle'
);

function patchJavaFile() {
  if (!fs.existsSync(javaFile)) {
    console.log(`[patch-capacitor-android] skip: Java file not found: ${javaFile}`);
    return;
  }

  const original = fs.readFileSync(javaFile, 'utf8');
  let next = original;

  // Replace VERSION_CODES.VANILLA_ICE_CREAM with numeric SDK check (35).
  next = next.replace(
    /Build\.VERSION_CODES\.VANILLA_ICE_CREAM/g,
    '35 /* VANILLA_ICE_CREAM */'
  );

  // Replace android.R.attr.windowOptOutEdgeToEdgeEnforcement with reflection-based lookup.
  next = next.replace(
    /^\s*boolean\s+foundOptOut\s*=\s*getContext\(\)\.getTheme\(\)\.resolveAttribute\(android\.R\.attr\.windowOptOutEdgeToEdgeEnforcement,\s*value,\s*true\);\s*$/m,
    [
      '            int optOutAttr = getResources().getIdentifier("windowOptOutEdgeToEdgeEnforcement", "attr", "android");',
      '            boolean foundOptOut = optOutAttr != 0 && getContext().getTheme().resolveAttribute(optOutAttr, value, true);'
    ].join('\n')
  );

  // Repair a previously-broken patch format if present.
  next = next.replace(
    /^\s*boolean\s+foundOptOut\s*=\s*int\s+optOutAttr\s*=\s*getResources\(\)\.getIdentifier\("windowOptOutEdgeToEdgeEnforcement",\s*"attr",\s*"android"\);\s*$/m,
    [
      '            int optOutAttr = getResources().getIdentifier("windowOptOutEdgeToEdgeEnforcement", "attr", "android");',
      '            boolean foundOptOut = optOutAttr != 0 && getContext().getTheme().resolveAttribute(optOutAttr, value, true);'
    ].join('\n')
  );

  // If the file ended up with duplicated `foundOptOut` lines, collapse them to a single one.
  next = next.replace(
    /(^\s*boolean\s+foundOptOut\s*=\s*optOutAttr\s*!=\s*0\s*&&\s*getContext\(\)\.getTheme\(\)\.resolveAttribute\(optOutAttr,\s*value,\s*true\);\s*$\n)\1/m,
    '$1'
  );

  if (next !== original) {
    fs.writeFileSync(javaFile, next, 'utf8');
    console.log('[patch-capacitor-android] patched Java file:', javaFile);
  } else {
    console.log('[patch-capacitor-android] Java file already patched');
  }
}

function patchBuildGradle() {
  if (!fs.existsSync(buildGradleFile)) {
    console.log(`[patch-capacitor-android] skip: build.gradle file not found: ${buildGradleFile}`);
    return;
  }

  const original = fs.readFileSync(buildGradleFile, 'utf8');
  let next = original;

  // Replace JavaVersion.VERSION_21 with JavaVersion.VERSION_17
  next = next.replace(/JavaVersion\.VERSION_21/g, 'JavaVersion.VERSION_17');

  if (next !== original) {
    fs.writeFileSync(buildGradleFile, next, 'utf8');
    console.log('[patch-capacitor-android] patched build.gradle:', buildGradleFile);
  } else {
    console.log('[patch-capacitor-android] build.gradle already patched');
  }
}

function patchAllCapacitorPackages() {
  const capacitorPackages = [
    'app',
    'preferences',
    'filesystem',
    'share',
    'splash-screen',
    'status-bar',
    'browser'
  ];

  const nodeModulesPath = path.join(__dirname, '..', 'node_modules', '@capacitor');
  
  capacitorPackages.forEach(pkg => {
    const buildGradlePath = path.join(nodeModulesPath, pkg, 'android', 'build.gradle');
    
    if (fs.existsSync(buildGradlePath)) {
      try {
        const original = fs.readFileSync(buildGradlePath, 'utf8');
        let next = original;

        // Replace JavaVersion.VERSION_21 with JavaVersion.VERSION_17
        next = next.replace(/JavaVersion\.VERSION_21/g, 'JavaVersion.VERSION_17');

        if (next !== original) {
          fs.writeFileSync(buildGradlePath, next, 'utf8');
          console.log(`[patch-capacitor-android] patched ${pkg}/build.gradle`);
        }
      } catch (e) {
        console.log(`[patch-capacitor-android] skip ${pkg}/build.gradle: ${e.message}`);
      }
    }
  });

  // Patch capacitor-cordova-android-plugins build.gradle
  const cordovaPluginsPath = path.join(__dirname, '..', 'android', 'capacitor-cordova-android-plugins', 'build.gradle');
  if (fs.existsSync(cordovaPluginsPath)) {
    try {
      const original = fs.readFileSync(cordovaPluginsPath, 'utf8');
      let next = original;

      // Replace JavaVersion.VERSION_21 with JavaVersion.VERSION_17
      next = next.replace(/JavaVersion\.VERSION_21/g, 'JavaVersion.VERSION_17');

      if (next !== original) {
        fs.writeFileSync(cordovaPluginsPath, next, 'utf8');
        console.log(`[patch-capacitor-android] patched capacitor-cordova-android-plugins/build.gradle`);
      }
    } catch (e) {
      console.log(`[patch-capacitor-android] skip capacitor-cordova-android-plugins/build.gradle: ${e.message}`);
    }
  }
}

try {
  patchJavaFile();
  patchBuildGradle();
  patchAllCapacitorPackages();
} catch (e) {
  console.error('[patch-capacitor-android] failed:', e);
  process.exit(1);
}


