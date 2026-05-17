package com.aria.assistant;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "FloatingBubble")
public class FloatingBubblePlugin extends Plugin {

    private static final int REQ_OVERLAY = 2001;

    /** Bắt đầu bubble — yêu cầu quyền nếu chưa có */
    @PluginMethod
    public void start(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && !Settings.canDrawOverlays(getContext())) {
            // Mở màn hình cấp quyền "Hiển thị trên app khác"
            Intent intent = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getContext().getPackageName())
            );
            getActivity().startActivityForResult(intent, REQ_OVERLAY);
            call.reject("PERMISSION_REQUIRED",
                    "Vui lòng cấp quyền 'Hiển thị trên app khác' rồi thử lại.");
            return;
        }
        startService();
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    /** Dừng bubble */
    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), FloatingBubbleService.class));
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    /** Kiểm tra bubble đang chạy không */
    @PluginMethod
    public void isRunning(PluginCall call) {
        android.app.ActivityManager am = (android.app.ActivityManager)
                getContext().getSystemService(android.content.Context.ACTIVITY_SERVICE);
        boolean running = false;
        for (android.app.ActivityManager.RunningServiceInfo svc
                : am.getRunningServices(Integer.MAX_VALUE)) {
            if (FloatingBubbleService.class.getName().equals(svc.service.getClassName())) {
                running = true;
                break;
            }
        }
        JSObject ret = new JSObject();
        ret.put("running", running);
        call.resolve(ret);
    }

    /** Gọi lại sau khi user cấp quyền overlay */
    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_OVERLAY) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                    && Settings.canDrawOverlays(getContext())) {
                startService();
            }
        }
    }

    private void startService() {
        Intent intent = new Intent(getContext(), FloatingBubbleService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }
    }
}
