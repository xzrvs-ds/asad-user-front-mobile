#!/bin/bash

# CI/CD Test Script (Android Studio SDK yo'q holda)
# Bu script Appflow yoki CI/CD muhitida ishlatish uchun optimallashtirilgan
# Gradle wrapper SDK ni avtomatik yuklab oladi

set -e  # Xatolik bo'lsa to'xtatish

echo "🚀 CI/CD Test Script boshlanmoqda..."
echo "📦 Android Studio SDK talab qilinmaydi (Gradle wrapper SDK ni yuklab oladi)"
echo ""

# Java versiyasini tekshirish
echo "☕ Java versiyasini tekshirish..."
if ! command -v java &> /dev/null; then
    echo "❌ Java topilmadi! Java 17 yoki yuqori versiya kerak."
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | sed '/^1\./s///' | cut -d'.' -f1)
echo "✅ Java versiyasi: $JAVA_VERSION"

if [ "$JAVA_VERSION" -lt 17 ]; then
    echo "⚠️  Java 17 yoki yuqori tavsiya etiladi (hozirgi: $JAVA_VERSION)"
fi
echo ""

# 1. TypeScript va Build Test
echo "📝 1. TypeScript kompilatsiya va build..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ TypeScript kompilatsiya muvaffaqiyatli!"
else
    echo "❌ TypeScript xatolik topildi!"
    exit 1
fi
echo ""

# 2. Lint Test (ogohlantirishlar build ni to'xtatmaydi)
echo "🔍 2. ESLint tekshiruvi..."
npm run lint || echo "⚠️  ESLint ogohlantirishlar topildi (build davom etadi)"
echo ""

# 3. Capacitor Sync
echo "🔄 3. Capacitor sync..."
npm run cap:sync
if [ $? -eq 0 ]; then
    echo "✅ Capacitor sync muvaffaqiyatli!"
else
    echo "❌ Capacitor sync xatolik!"
    exit 1
fi
echo ""

# 4. Gradle Wrapper ni tekshirish
echo "🔧 4. Gradle wrapper ni tekshirish..."
if [ ! -f "android/gradlew" ]; then
    echo "❌ Gradle wrapper topilmadi!"
    exit 1
fi

# Gradle wrapper ga execute ruxsati berish
chmod +x android/gradlew
echo "✅ Gradle wrapper tayyor!"
echo ""

# 5. Android Gradle Clean
echo "🧹 5. Gradle clean..."
cd android
./gradlew clean --no-daemon
if [ $? -eq 0 ]; then
    echo "✅ Gradle clean muvaffaqiyatli!"
else
    echo "❌ Gradle clean xatolik!"
    exit 1
fi
echo ""

# 6. Android Build Test (debug) - SDK avtomatik yuklanadi
echo "🔨 6. Android Debug APK build..."
echo "⏳ SDK avtomatik yuklanmoqda (birinchi marta uzoqroq vaqt olishi mumkin)..."
./gradlew assembleDebug --no-daemon --stacktrace
if [ $? -eq 0 ]; then
    echo "✅ Debug APK build muvaffaqiyatli!"
    echo "📦 APK joylashuvi: android/app/build/outputs/apk/debug/app-debug.apk"
else
    echo "❌ Debug APK build xatolik!"
    exit 1
fi
echo ""

# 7. APK faylini tekshirish
echo "📱 7. APK faylini tekshirish..."
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    APK_SIZE_BYTES=$(stat -f%z "$APK_PATH" 2>/dev/null || stat -c%s "$APK_PATH" 2>/dev/null || echo "N/A")
    echo "✅ APK yaratildi: $APK_SIZE ($APK_SIZE_BYTES bytes)"
    echo "📍 To'liq yo'l: $(pwd)/$APK_PATH"
    
    # APK hajmini tekshirish (minimal 1MB bo'lishi kerak)
    if [ "$APK_SIZE_BYTES" != "N/A" ] && [ "$APK_SIZE_BYTES" -lt 1048576 ]; then
        echo "⚠️  APK hajmi juda kichik, muammo bo'lishi mumkin!"
    fi
else
    echo "❌ APK fayli topilmadi!"
    exit 1
fi
echo ""

cd ..

echo "🎉 Barcha CI/CD testlar muvaffaqiyatli o'tdi!"
echo ""
echo "✅ Appflow ga yuklashga tayyor!"
echo ""
echo "📋 Test natijalari:"
echo "   ✅ TypeScript kompilatsiya"
echo "   ✅ Build fayllar"
echo "   ✅ Capacitor sync"
echo "   ✅ Gradle build"
echo "   ✅ APK yaratildi"

