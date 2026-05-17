package com.aria.assistant;

import android.app.ActivityManager;
import android.app.AppOpsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.List;

@CapacitorPlugin(name = "AppWatcher")
public class AppWatcherPlugin extends Plugin {

    @PluginMethod
    public void hasPermission(PluginCall call) {
        JSObject r = new JSObject();
        r.put("granted", checkUsagePermission());
        call.resolve(r);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        JSObject r = new JSObject();
        r.put("opened", true);
        call.resolve(r);
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (!checkUsagePermission()) {
            call.reject("PERMISSION_REQUIRED");
            return;
        }
        Context ctx = getContext();
        Intent svc  = new Intent(ctx, AppWatcherService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ctx.startForegroundService(svc);
        } else {
            ctx.startService(svc);
        }
        JSObject r = new JSObject();
        r.put("success", true);
        call.resolve(r);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), AppWatcherService.class));
        JSObject r = new JSObject();
        r.put("success", true);
        call.resolve(r);
    }

    @PluginMethod
    public void isRunning(PluginCall call) {
        ActivityManager am = (ActivityManager) getContext().getSystemService(Context.ACTIVITY_SERVICE);
        boolean running = false;
        if (am != null) {
            List<ActivityManager.RunningServiceInfo> services = am.getRunningServices(50);
            String name = AppWatcherService.class.getName();
            for (ActivityManager.RunningServiceInfo s : services) {
                if (name.equals(s.service.getClassName())) { running = true; break; }
            }
        }
        JSObject r = new JSObject();
        r.put("running", running);
        call.resolve(r);
    }

    @PluginMethod
    public void getCurrentApp(PluginCall call) {
        SharedPreferences prefs = getContext()
                .getSharedPreferences(AppWatcherService.PREFS, Context.MODE_PRIVATE);
        String raw = prefs.getString(AppWatcherService.KEY_CURRENT, null);
        JSObject r = new JSObject();
        if (raw != null) {
            try {
                JSONObject obj = new JSONObject(raw);
                r.put("pkg",  obj.getString("pkg"));
                r.put("name", obj.getString("name"));
                r.put("ts",   obj.getLong("ts"));
            } catch (Exception ignored) {}
        }
        call.resolve(r);
    }

    @PluginMethod
    public void getAppHistory(PluginCall call) {
        SharedPreferences prefs = getContext()
                .getSharedPreferences(AppWatcherService.PREFS, Context.MODE_PRIVATE);
        String raw = prefs.getString(AppWatcherService.KEY_HISTORY, "[]");
        JSObject r = new JSObject();
        try {
            JSONArray arr  = new JSONArray(raw);
            JSArray   list = new JSArray();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject item = arr.getJSONObject(i);
                JSObject   o    = new JSObject();
                o.put("pkg",  item.getString("pkg"));
                o.put("name", item.getString("name"));
                o.put("ts",   item.getLong("ts"));
                list.put(o);
            }
            r.put("list", list);
        } catch (Exception e) {
            r.put("list", new JSArray());
        }
        call.resolve(r);
    }

    // ── Helpers ───────────────────────────────────────────

    private boolean checkUsagePermission() {
        try {
            Context ctx    = getContext();
            AppOpsManager ops = (AppOpsManager) ctx.getSystemService(Context.APP_OPS_SERVICE);
            int mode = ops.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    android.os.Process.myUid(),
                    ctx.getPackageName());
            return mode == AppOpsManager.MODE_ALLOWED;
        } catch (Exception e) {
            return false;
        }
    }
}
