// ============================================================
// ⚠️ تحذير | WARNING
// ------------------------------------------------------------
// 🇸🇦 لا تقم بتشفير رابط قاعدة البيانات أو إنشاء قاعدة بيانات جديدة.
//    المالك (ناير) يتحمل كامل المسؤولية عن هذا الاختيار.
//    رابط Backend يُدخله المستخدم في إعدادات التطبيق.
//
// 🇬🇧 Do NOT encrypt the database URL or create a new database.
//    The owner (Nayer) takes full responsibility for this decision.
//    Backend URL is entered by the user in app settings.
// ============================================================

package com.callverify

import android.Manifest
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val prefs = getSharedPreferences("callverify", MODE_PRIVATE)

        val urlField = findViewById<EditText>(R.id.backendUrl)
        val keyField = findViewById<EditText>(R.id.apiKey)
        val saveBtn = findViewById<Button>(R.id.saveBtn)
        val statusText = findViewById<TextView>(R.id.status)

        // تحميل القيم المحفوظة | Load saved values
        urlField.setText(prefs.getString("backend_url", ""))
        keyField.setText(prefs.getString("api_key", ""))

        // حفظ الإعدادات | Save settings
        saveBtn.setOnClickListener {
            prefs.edit()
                .putString("backend_url", urlField.text.toString().trim())
                .putString("api_key", keyField.text.toString().trim())
                .apply()
            statusText.text = "✅ تم الحفظ — التطبيق جاهز | Saved — App is ready"
        }

        // طلب الصلاحيات | Request permissions
        ActivityCompat.requestPermissions(
            this,
            arrayOf(
                Manifest.permission.READ_PHONE_STATE,
                Manifest.permission.READ_CALL_LOG
            ),
            1001
        )
    }
}
