package com.aria.assistant;

import android.app.Notification;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

public class MeiNotificationService extends NotificationListenerService {

    static final String PREFS = "mei_notifications";
    static final String KEY   = "notif_list";
    private static final int MAX = 60;

    // App packages to ignore (system noise)
    private static final String[] IGNORE_PKG = {
        "android", "com.android.systemui", "com.android.settings",
        "com.google.android.gms", "com.android.phone"
    };

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || sbn.isOngoing()) return;
        String pkg = sbn.getPackageName();
        for (String skip : IGNORE_PKG) {
            if (pkg.startsWith(skip)) return;
        }

        Notification notif  = sbn.getNotification();
        Bundle       extras = notif.extras;
        if (extras == null) return;

        String title = extras.getString(Notification.EXTRA_TITLE, "");
        CharSequence bodyCs = extras.getCharSequence(Notification.EXTRA_TEXT);
        String body = bodyCs != null ? bodyCs.toString() : "";

        if (title.isEmpty() && body.isEmpty()) return;

        String appName = resolveAppName(pkg);
        store(appName, pkg, title, body, sbn.getPostTime());
    }

    private String resolveAppName(String pkg) {
        try {
            return getPackageManager()
                .getApplicationLabel(getPackageManager().getApplicationInfo(pkg, 0))
                .toString();
        } catch (PackageManager.NameNotFoundException e) {
            return pkg;
        }
    }

    private void store(String app, String pkg, String title, String body, long time) {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
            JSONArray arr = new JSONArray(prefs.getString(KEY, "[]"));

            JSONObject obj = new JSONObject();
            obj.put("app",   app);
            obj.put("pkg",   pkg);
            obj.put("title", title);
            obj.put("body",  body);
            obj.put("time",  time);

            JSONArray next = new JSONArray();
            next.put(obj);
            for (int i = 0; i < Math.min(arr.length(), MAX - 1); i++) next.put(arr.get(i));

            prefs.edit().putString(KEY, next.toString()).apply();
        } catch (Exception ignored) {}
    }
}
