package com.aria.assistant;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import androidx.core.app.NotificationCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashSet;
import java.util.Set;

public class AppWatcherService extends Service {

    static final String PREFS       = "mei_app_watcher";
    static final String KEY_CURRENT = "current_app_json";
    static final String KEY_HISTORY = "app_history_json";

    private static final String CHANNEL_ID   = "mei_appwatcher_channel";
    private static final int    NOTIF_ID     = 1003;
    private static final long   POLL_MS      = 4000L;   // poll every 4 s
    private static final int    MAX_HISTORY  = 10;

    // Packages to ignore (system / self)
    private static final Set<String> IGNORE = new HashSet<>();
    static {
        IGNORE.add("com.aria.assistant");
        IGNORE.add("android");
        IGNORE.add("com.android.systemui");
        IGNORE.add("com.android.launcher");
        IGNORE.add("com.android.launcher3");
        IGNORE.add("com.miui.home");
        IGNORE.add("com.samsung.android.app.launcher");
        IGNORE.add("com.google.android.apps.nexuslauncher");
    }

    private final Handler handler = new Handler(Looper.getMainLooper());
    private UsageStatsManager usageStats;
    private PackageManager    pm;
    private String            lastPkg = "";

    // ── Lifecycle ──────────────────────────────────────────

    @Override
    public void onCreate() {
        super.onCreate();
        usageStats = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
        pm         = getPackageManager();
        startForeground(NOTIF_ID, buildNotification());
        handler.post(pollRunnable);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(pollRunnable);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    // ── Poll loop ──────────────────────────────────────────

    private final Runnable pollRunnable = new Runnable() {
        @Override public void run() {
            try { detectForegroundApp(); } catch (Exception ignored) {}
            handler.postDelayed(this, POLL_MS);
        }
    };

    private void detectForegroundApp() {
        long now    = System.currentTimeMillis();
        long window = POLL_MS * 3;                  // look-back window

        UsageEvents events = usageStats.queryEvents(now - window, now);
        if (events == null) return;

        String latestPkg = null;
        long   latestTs  = 0;
        UsageEvents.Event ev = new UsageEvents.Event();
        while (events.hasNextEvent()) {
            events.getNextEvent(ev);
            if (ev.getEventType() == UsageEvents.Event.MOVE_TO_FOREGROUND
                    && ev.getTimeStamp() > latestTs) {
                latestPkg = ev.getPackageName();
                latestTs  = ev.getTimeStamp();
            }
        }

        if (latestPkg == null || IGNORE.contains(latestPkg)) return;
        if (latestPkg.equals(lastPkg)) return;   // no change

        lastPkg = latestPkg;
        String appName = getAppName(latestPkg);
        saveAppInfo(latestPkg, appName, latestTs);
    }

    private String getAppName(String pkg) {
        try {
            ApplicationInfo info = pm.getApplicationInfo(pkg, 0);
            return pm.getApplicationLabel(info).toString();
        } catch (PackageManager.NameNotFoundException e) {
            return pkg;
        }
    }

    // ── Persistence ────────────────────────────────────────

    private void saveAppInfo(String pkg, String name, long ts) {
        SharedPreferences prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE);

        // Current app
        try {
            JSONObject cur = new JSONObject();
            cur.put("pkg",  pkg);
            cur.put("name", name);
            cur.put("ts",   ts);
            prefs.edit().putString(KEY_CURRENT, cur.toString()).apply();
        } catch (Exception ignored) {}

        // History (keep last MAX_HISTORY entries, no duplicates at head)
        try {
            JSONArray hist = new JSONArray();
            String raw = prefs.getString(KEY_HISTORY, "[]");
            JSONArray old = new JSONArray(raw);

            // New entry at front
            JSONObject entry = new JSONObject();
            entry.put("pkg",  pkg);
            entry.put("name", name);
            entry.put("ts",   ts);
            hist.put(entry);

            for (int i = 0; i < old.length() && hist.length() < MAX_HISTORY; i++) {
                JSONObject o = old.getJSONObject(i);
                if (!o.getString("pkg").equals(pkg)) hist.put(o);
            }
            prefs.edit().putString(KEY_HISTORY, hist.toString()).apply();
        } catch (Exception ignored) {}
    }

    // ── Notification ──────────────────────────────────────

    private Notification buildNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "Mei App Watcher", NotificationManager.IMPORTANCE_MIN);
            ch.setShowBadge(false);
            ch.setSound(null, null);
            getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Mei đang nhìn~")
                .setContentText("Em biết anh đang dùng gì đó ♡")
                .setSmallIcon(android.R.drawable.ic_menu_view)
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .setOngoing(true)
                .build();
    }
}
