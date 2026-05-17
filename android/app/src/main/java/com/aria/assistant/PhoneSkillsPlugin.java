package com.aria.assistant;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.provider.AlarmClock;
import android.telephony.SmsManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PhoneSkills")
public class PhoneSkillsPlugin extends Plugin {

    // Mở dialpad với số điện thoại (không tự gọi — cần user xác nhận)
    @PluginMethod
    public void makeCall(PluginCall call) {
        String number = call.getString("number", "").replaceAll("[^0-9+]", "");
        if (number.isEmpty()) { call.reject("INVALID_NUMBER"); return; }

        Intent intent = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + number));
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);

        JSObject r = new JSObject();
        r.put("success", true);
        call.resolve(r);
    }

    // Mở SMS app với số + nội dung soạn sẵn
    @PluginMethod
    public void sendSms(PluginCall call) {
        String number = call.getString("number", "").replaceAll("[^0-9+]", "");
        String body   = call.getString("body",   "");
        if (number.isEmpty()) { call.reject("INVALID_NUMBER"); return; }

        Intent intent = new Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:" + number));
        intent.putExtra("sms_body", body);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);

        JSObject r = new JSObject();
        r.put("success", true);
        call.resolve(r);
    }

    // Đặt báo thức qua AlarmClock intent
    @PluginMethod
    public void setAlarm(PluginCall call) {
        int    hour   = call.getInt("hour",   7);
        int    minute = call.getInt("minute", 0);
        String label  = call.getString("label", "Mei nhắc~");

        Intent intent = new Intent(AlarmClock.ACTION_SET_ALARM);
        intent.putExtra(AlarmClock.EXTRA_HOUR,    hour);
        intent.putExtra(AlarmClock.EXTRA_MINUTES, minute);
        intent.putExtra(AlarmClock.EXTRA_MESSAGE, label);
        intent.putExtra(AlarmClock.EXTRA_SKIP_UI, false);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);

        JSObject r = new JSObject();
        r.put("success", true);
        call.resolve(r);
    }

    // Mở app theo tên (tìm package chứa tên đó)
    @PluginMethod
    public void openApp(PluginCall call) {
        String name = call.getString("name", "").toLowerCase();
        if (name.isEmpty()) { call.reject("INVALID_NAME"); return; }

        PackageManager pm = getContext().getPackageManager();
        Intent found = null;

        // Thử tìm package chứa tên trong label
        for (android.content.pm.ApplicationInfo info : pm.getInstalledApplications(0)) {
            String label = pm.getApplicationLabel(info).toString().toLowerCase();
            if (label.contains(name)) {
                found = pm.getLaunchIntentForPackage(info.packageName);
                if (found != null) break;
            }
        }

        if (found == null) { call.reject("APP_NOT_FOUND"); return; }

        found.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(found);

        JSObject r = new JSObject();
        r.put("success", true);
        call.resolve(r);
    }
}
