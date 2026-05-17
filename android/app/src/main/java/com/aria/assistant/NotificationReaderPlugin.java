package com.aria.assistant;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NotificationReader")
public class NotificationReaderPlugin extends Plugin {

    @PluginMethod
    public void getNotifications(PluginCall call) {
        call.resolve();
    }
}