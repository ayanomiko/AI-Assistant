package com.aria.assistant;

import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

@CapacitorPlugin(name = "WakeWord")
public class WakeWordPlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        Context ctx = getContext();
        Intent svc = new Intent(ctx, WakeWordService.class);
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
        getContext().stopService(new Intent(getContext(), WakeWordService.class));
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
            String name = WakeWordService.class.getName();
            for (ActivityManager.RunningServiceInfo s : services) {
                if (name.equals(s.service.getClassName())) {
                    running = true;
                    break;
                }
            }
        }
        JSObject r = new JSObject();
        r.put("running", running);
        call.resolve(r);
    }
}
