/**
 * Patch @capacitor/android to avoid compile-time references to Android 15 (API 35) symbols.
 *
 * Why:
 * - Appflow runner SDK 35 android.jar appears broken (aapt2 can't load it)
 * - But Capacitor v7 references API 35-only symbols in CapacitorWebView.java
 * - We build against compileSdk=34 and use runtime checks + reflection instead.
 */
const fs = require('fs');
const path = require('path');

const targetFile = path.join(
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

function patch() {
  if (!fs.existsSync(targetFile)) {
    console.log(`[patch-capacitor-android] skip: file not found: ${targetFile}`);
    return;
  }

  const original = fs.readFileSync(targetFile, 'utf8');
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

  if (next === original) {
    console.log('[patch-capacitor-android] noop: already patched');
    return;
  }

  fs.writeFileSync(targetFile, next, 'utf8');
  console.log('[patch-capacitor-android] patched:', targetFile);
}

try {
  patch();
} catch (e) {
  console.error('[patch-capacitor-android] failed:', e);
  process.exit(1);
}


