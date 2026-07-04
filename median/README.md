# CallVerify — دليل Median.co

## ما هو Median.co؟

Median.co يحوّل أي موقع ويب إلى تطبيق Android/iOS حقيقي بدون كتابة Kotlin أو Swift.
يعمل عبر WebView مع إضافة ميزات Native (كاميرا، إشعارات، صلاحيات...).

---

## خطوات البناء (Build)

### 1. انشر الموقع أولاً

```bash
# تأكد من أن الموقع منشور وعلى رابط ثابت
# مثال: https://callverify.replit.app/admin-panel/
```

### 2. حدّث `median.json`

افتح الملف `/median.json` في جذر المشروع وغيّر **كل** حالة `YOUR_DEPLOYED_URL_HERE`:

```json
{
  "general": {
    "initialURL": "https://callverify.replit.app/admin-panel/"
  },
  "webview": {
    "openLinkInExternalBrowser": {
      "regex": "^(?!https:\\/\\/callverify\\.replit\\.app).*"
    }
  },
  "push": {
    "registration": {
      "url": "https://callverify.replit.app/api/push/register"
    }
  }
}
```

### 3. أضف أصول التطبيق

ضع هذه الملفات في مجلد `median/assets/`:

| الملف | الأبعاد | الوصف |
|-------|---------|--------|
| `icon.png` | 1024×1024 px | أيقونة التطبيق (PNG بخلفية) |
| `splash.png` | 2048×2048 px | صورة شاشة البداية |
| `offline.png` | 512×512 px | صورة شاشة عدم الاتصال |

### 4. ارفع إلى Median.co

1. اذهب إلى [https://median.co](https://median.co)
2. أنشئ تطبيقاً جديداً
3. أدخل رابط موقعك
4. في "Advanced Config" أو "JSON Config" — انسخ محتوى `median.json`
5. ارفع الأيقونة والـ Splash Screen
6. اضغط **Build** → انتظر APK

---

## كيف تغيّر رابط الموقع لاحقاً

**بدون إعادة بناء التطبيق كاملاً:**

1. افتح [https://median.co/dashboard](https://median.co/dashboard)
2. اختر التطبيق → **Settings** → **Initial URL**
3. غيّر الرابط واضغط **Rebuild**

**في الكود (إذا كنت تبني محلياً):**

```json
// median.json
{
  "general": {
    "initialURL": "https://NEW_URL_HERE"
  }
}
```

> التطبيقات الجاهزة على المتجر تحتاج rebuild عند تغيير الرابط،
> لكن يمكن تجنب ذلك بجعل الرابط الأولي صفحة redirect تقرأ الرابط من API.

---

## الميزات المُجهَّزة للمستقبل

### اكتشاف المكالمات الواردة

**ما يجب فعله عند التفعيل:**

1. في `median.json` — غيّر:
   ```json
   "phoneCallListener": { "enabled": true }
   ```

2. في `median-bridge.js` — الدوال جاهزة:
   ```javascript
   window.CallVerifyBridge.onIncomingCall(callerPhone)
   ```

3. في `src/lib/median-bridge.ts` — استخدم:
   ```typescript
   import { onIncomingCall } from '@/lib/median-bridge';

   const stop = onIncomingCall(async (callerPhone) => {
     await ApiService.calls.reportIncomingCall(callerPhone, APP_SECRET);
   });
   ```

### Push Notifications

**جاهز بالكامل** — فقط:
1. أضف Firebase project وانسخ `google-services.json`
2. ارفعه في Median dashboard
3. الكود في `src/lib/median-bridge.ts` → `requestPushPermission()` جاهز

---

## ملفات المشروع المتعلقة بـ Median

```
/
├── median.json                              ← إعدادات Median الرئيسية
├── median/
│   ├── README.md                           ← هذا الملف
│   └── assets/                             ← ضع هنا icon.png, splash.png
└── artifacts/admin-panel/
    ├── public/
    │   ├── median-bridge.js                ← يُحقن في كل صفحة تلقائياً
    │   └── offline.html                    ← صفحة عدم الاتصال
    └── src/lib/
        ├── median-bridge.ts                ← TypeScript bridge (جسر Native)
        └── api-service.ts                  ← طبقة API المركزية
```

---

## الصلاحيات المُعرَّفة

| الصلاحية | الحالة | السبب |
|----------|--------|--------|
| CAMERA | ✅ مفعّل | رفع الصور |
| READ_EXTERNAL_STORAGE | ✅ مفعّل | رفع الملفات |
| INTERNET | ✅ مفعّل | أساسي |
| READ_PHONE_STATE | ✅ مفعّل | للمكالمات مستقبلاً |
| READ_CALL_LOG | ✅ مفعّل | لقراءة رقم المتصل مستقبلاً |
| POST_NOTIFICATIONS | ✅ مفعّل | الإشعارات |
| FOREGROUND_SERVICE | ✅ مفعّل | العمل في الخلفية مستقبلاً |
| RECEIVE_BOOT_COMPLETED | ✅ مفعّل | للتشغيل مع الجهاز مستقبلاً |

---

## متطلبات Android

- **Min SDK**: 26 (Android 8.0 Oreo)
- **Target SDK**: 34 (Android 14)
- **Package**: `com.company.callverify`
