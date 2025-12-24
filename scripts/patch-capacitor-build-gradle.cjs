/**
 * Patch capacitor.build.gradle to use Java 17 instead of Java 21.
 *
 * Why:
 * - Capacitor 7.4.4 generates capacitor.build.gradle with JavaVersion.VERSION_21
 * - Gradle 7.5.1 doesn't support Java 21 (requires Gradle 8.5+)
 * - Java 17 is LTS and fully supported by Gradle 7.5.1
 */
const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '..',
  'android',
  'app',
  'capacitor.build.gradle'
);

function patch() {
  if (!fs.existsSync(targetFile)) {
    console.log(`[patch-capacitor-build-gradle] skip: file not found: ${targetFile}`);
    return;
  }

  const original = fs.readFileSync(targetFile, 'utf8');
  let next = original;

  // Replace VERSION_21 with VERSION_17
  next = next.replace(/JavaVersion\.VERSION_21/g, 'JavaVersion.VERSION_17');

  if (next === original) {
    console.log('[patch-capacitor-build-gradle] noop: already patched or no changes needed');
    return;
  }

  fs.writeFileSync(targetFile, next, 'utf8');
  console.log('[patch-capacitor-build-gradle] patched:', targetFile);
}

try {
  patch();
} catch (e) {
  console.error('[patch-capacitor-build-gradle] failed:', e);
  process.exit(1);
}

