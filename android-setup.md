# Hướng dẫn setup Android — Mei AI

## Bước 1 — Tạo Android project
```bash
npx cap add android
npx cap sync
```

---

## Bước 2 — Đăng ký tất cả plugin trong MainActivity.java
Mở: `android/app/src/main/java/com/aria/assistant/MainActivity.java`

```java
package com.aria.assistant;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FloatingBubblePlugin.class);
        registerPlugin(NotificationReaderPlugin.class);
        registerPlugin(WakeWordPlugin.class);
        registerPlugin(AppWatcherPlugin.class);
        registerPlugin(PhoneSkillsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
```

---

## Bước 3 — AndroidManifest.xml đầy đủ
Mở: `android/app/src/main/AndroidManifest.xml`

### Thêm permissions (trước thẻ `<application>`):
```xml
<!-- Overlay (cross-app bubble) -->
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<!-- Foreground services -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
<!-- Notification reader -->
<uses-permission android:name="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE" />
<!-- Microphone (wake word) -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<!-- Boot (tự khởi động lại sau restart) -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<!-- App watcher (nhìn ra ngoài cửa sổ) -->
<uses-permission android:name="android.permission.PACKAGE_USAGE_STATS"
    tools:ignore="ProtectedPermissions" />
```

### Thêm services + receiver trong `<application>` (sau `</activity>`):
```xml
<!-- Floating bubble cross-app -->
<service
    android:name=".FloatingBubbleService"
    android:enabled="true"
    android:exported="false"
    android:foregroundServiceType="specialUse" />

<!-- Đọc notification app khác -->
<service
    android:name=".MeiNotificationService"
    android:label="Mei AI"
    android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"
    android:exported="true">
    <intent-filter>
        <action android:name="android.service.notification.NotificationListenerService" />
    </intent-filter>
</service>

<!-- Wake word "Hey Mei" -->
<service
    android:name=".WakeWordService"
    android:enabled="true"
    android:exported="false"
    android:foregroundServiceType="microphone" />

<!-- App watcher service -->
<service
    android:name=".AppWatcherService"
    android:enabled="true"
    android:exported="false"
    android:foregroundServiceType="specialUse" />

<!-- Widget màn hình chính -->
<receiver
    android:name=".MeiWidget"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/mei_widget_info" />
</receiver>
```

---

## Bước 4 — Sync và build APK
```bash
npx cap sync
npx cap open android
```
Trong Android Studio: **Build → Build APK(s)**

---

## Bước 5 — Cấp quyền trên điện thoại

| Tính năng | Quyền cần cấp | Cách cấp |
|---|---|---|
| Cross-app bubble | "Hiển thị trên app khác" | App tự mở Settings khi bật toggle |
| Đọc notification | Notification access | Settings → Notification access → Mei AI |
| Wake word | Microphone | Popup tự hiện khi bật lần đầu |
| App Watcher | Usage Access | Settings → Usage Access → Mei AI |
| Widget | (không cần) | Thêm widget từ màn hình chính |

---

## Bước 6 — Thêm Widget lên màn hình chính
1. Giữ màn hình chính (long press)
2. Chọn **Widgets**
3. Tìm **Mei AI** → kéo lên màn hình
4. Widget tự cập nhật mỗi 30 phút

---

## Tóm tắt tính năng đã hoàn thành

- ✅ Chat AI với Mei (Gemini 1.5 Flash)
- ✅ Floating bubble trong app
- ✅ Cross-app floating bubble (overlay toàn màn hình)
- ✅ Nhắc nhở + thông báo
- ✅ Pomodoro học bài + AI Q&A
- ✅ Quản lý game time
- ✅ Voice input + TTS tiếng Việt
- ✅ Đọc notification app khác (WhatsApp, Zalo...)
- ✅ Wake word "Hey Mei"
- ✅ Widget màn hình chính
- ✅ App Watcher — "Mei nhìn ra ngoài cửa sổ"
- ✅ Xử lý hình ảnh (Gemini Vision)
- ✅ Điều khiển điện thoại (gọi, SMS, báo thức, mở app)
- ✅ Tóm tắt nội dung + Sáng tạo
- ✅ Background themes (6 preset + custom URL)
- ✅ Dark/Light mode
