# 🚀 Tezkor Test Qo'llanmasi

Android Studio SDK **YO'Q** bo'lsa ham test qilish uchun qo'llanma.

## ⚡ Eng Tezkor Test (1 ta buyruq)

```bash
npm run test:ci
```

Bu buyruq quyidagilarni bajaradi:
1. ✅ TypeScript kompilatsiya
2. ✅ Build va lint
3. ✅ Capacitor sync
4. ✅ Gradle build (SDK avtomatik yuklanadi)
5. ✅ APK yaratish

## 📋 Talablar

- ✅ Node.js va npm
- ✅ Java 17+ (JDK)
- ❌ Android Studio SDK **kerak emas** (Gradle wrapper avtomatik yuklab oladi)

## 🔍 Qadam-baqadam Test

### 1. TypeScript va Build

```bash
npm run build
```

### 2. Lint

```bash
npm run lint
```

### 3. Capacitor Sync

```bash
npm run cap:sync
```

### 4. Gradle Build (SDK avtomatik yuklanadi)

```bash
cd android
./gradlew clean assembleDebug --no-daemon
```

APK joylashuvi: `android/app/build/outputs/apk/debug/app-debug.apk`

## ✅ Test Checklist

- [ ] `npm run build` - muvaffaqiyatli
- [ ] `npm run lint` - xatoliklar yo'q
- [ ] `npm run cap:sync` - muvaffaqiyatli
- [ ] `./gradlew assembleDebug` - muvaffaqiyatli
- [ ] APK fayli yaratildi

## 🎯 Appflow ga Yuklashga Tayyor

Barcha testlar muvaffaqiyatli o'tgandan keyin:

1. Git commit qiling
2. Git push qiling
3. Appflow da build trigger qiling

## 💡 Maslahatlar

- **Birinchi marta** Gradle build uzoqroq vaqt olishi mumkin (SDK yuklanmoqda)
- **Keyingi marta** tezroq ishlaydi (cache ishlatiladi)
- Agar xatolik bo'lsa, `--stacktrace` qo'shing: `./gradlew assembleDebug --stacktrace`

## 🐛 Xatoliklar

### Java topilmadi
```bash
# Java versiyasini tekshirish
java -version

# Java 17+ o'rnatish kerak
```

### Gradle wrapper topilmadi
```bash
# Gradle wrapper ga ruxsat berish
chmod +x android/gradlew
```

### Build xatolik
```bash
# Cache ni tozalash
cd android
./gradlew clean --no-daemon
rm -rf .gradle
./gradlew assembleDebug --no-daemon --stacktrace
```

