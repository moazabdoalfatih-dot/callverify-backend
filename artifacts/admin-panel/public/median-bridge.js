/**
 * median-bridge.js
 *
 * يُحقن تلقائياً في كل صفحة عبر Median (مُعرَّف في median.json > javascript > calls)
 *
 * يوفر:
 * 1. كائن window.CallVerifyBridge للتواصل مع Kotlin مستقبلاً
 * 2. Polyfill للـ console.log في WebView (لتسهيل التصحيح)
 * 3. إشعار للصفحة عند اكتمال تهيئة Median
 */

(function () {
  'use strict';

  // ─── 1. CallVerify Native Bridge ─────────────────────────────
  // Kotlin سيستدعي هذه الدوال عبر JavascriptInterface مستقبلاً

  window.CallVerifyBridge = window.CallVerifyBridge || {
    /**
     * يُستدعى من Kotlin عند ورود مكالمة هاتفية
     * @param {string} callerPhone - رقم المتصل
     */
    onIncomingCall: function (callerPhone) {
      console.log('[CallVerify] Incoming call from:', callerPhone);
      window.dispatchEvent(
        new CustomEvent('callverify:incoming-call', {
          detail: { callerPhone: callerPhone },
        })
      );
    },

    /**
     * يُستدعى من Kotlin عند تسجيل Push Token
     * @param {string} token - FCM token
     */
    onPushToken: function (token) {
      console.log('[CallVerify] Push token received');
      window.dispatchEvent(
        new CustomEvent('callverify:push-token', {
          detail: { token: token },
        })
      );
    },

    /**
     * يُستدعى من Kotlin لإرسال بيانات عامة
     * @param {string} eventName - اسم الحدث
     * @param {*} data - البيانات
     */
    onNativeEvent: function (eventName, data) {
      window.dispatchEvent(
        new CustomEvent('callverify:native:' + eventName, {
          detail: typeof data === 'string' ? JSON.parse(data) : data,
        })
      );
    },
  };

  // ─── 2. Median Ready Event ───────────────────────────────────
  // أرسل حدثاً عند اكتمال تهيئة Median

  function fireMedianReady() {
    window.dispatchEvent(new CustomEvent('median:ready'));
    document.documentElement.setAttribute('data-median', 'true');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fireMedianReady);
  } else {
    fireMedianReady();
  }

  // ─── 3. Offline Detection ────────────────────────────────────

  window.addEventListener('online', function () {
    window.dispatchEvent(new CustomEvent('callverify:online'));
  });

  window.addEventListener('offline', function () {
    window.dispatchEvent(new CustomEvent('callverify:offline'));
  });

  // ─── 4. Back Button Handler ──────────────────────────────────
  // منع الخروج من التطبيق عند الضغط على Back في الصفحة الرئيسية

  document.addEventListener('median:backbutton', function (e) {
    if (window.history.length <= 1) {
      // إذا لا يوجد تاريخ — اترك Median يتعامل معه (قد يُظهر تأكيد الخروج)
      return;
    }
    window.history.back();
    e.preventDefault();
  });

  console.log('[CallVerify] Median bridge initialized');
})();
