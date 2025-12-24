/**
 * Patch capacitor.build.gradle to use Java 11 instead of Java 21.
 *
 * Why:
 * - Capacitor 7.4.4 generates capacitor.build.gradle with JavaVersion.VERSION_21
 * - Gradle 7.6.3 doesn't support Java 21 (requires Gradle 8.5+)
 * - CI/CD muhitlarida Java 11 eng keng tarqalgan va qo'llab-quvvatlanadi
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

  // Replace VERSION_21 with VERSION_11 (CI/CD uchun)
  next = next.replace(/JavaVersion\.VERSION_21/g, 'JavaVersion.VERSION_11');
  // Also replace VERSION_17 with VERSION_11 if present
  next = next.replace(/JavaVersion\.VERSION_17/g, 'JavaVersion.VERSION_11');

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

