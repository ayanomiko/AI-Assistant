package com.aria.assistant;

import android.content.Intent;
import android.content.SharedPreferences;
import android.provider.Settings;
import android.text.TextUtils;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;

@CapacitorPlugin(name = "NotificationReader")
public class NotificationReaderPlugin extends Plugin {

    @PluginMethod
    public void hasPermission(PluginCall call) {
        JSObject r = new JSObject();
        r.put("granted", isGranted());
        call.resolve(r);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (isGranted()) { call.resolve(); return; }
        Intent i = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.reject("PERMISSION_REQUIRED", "Cấp quyền rồi quay lại app");
    }

    @PluginMethod
    public void getNotifications(PluginCall call) {
        SharedPreferences prefs =
            getContext().getSharedPreferences(MeiNotificationService.PREFS, 0);
        String raw = prefs.getString(MeiNotificationService.KEY, "[]");
        try {
            JSObject r = new JSObject();
            r.put("list", new JSArray(raw));
            call.resolve(r);
        } catch (Exception e) {
            call.reject("ERROR", e.getMessage());
        }
    }

    @PluginMethod
    public void clearNotifications(PluginCall call) {
        getContext().getSharedPreferences(MeiNotificationService.PREFS, 0)
            .edit().remove(MeiNotificationService.KEY).apply();
        call.resolve();
    }

    private boolean isGranted() {
        String s = Settings.Secure.getString(
            getContext().getContentResolver(), "enabled_notification_listeners");
        return !TextUtils.isEmpty(s) && s.contains(getContext().getPackageName());
    }
}
