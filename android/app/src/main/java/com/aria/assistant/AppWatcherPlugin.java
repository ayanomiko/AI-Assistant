package com.aria.assistant;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AppWatcher")
public class AppWatcherPlugin extends Plugin {

    @PluginMethod
    public void getCurrentApp(PluginCall call) {
        call.resolve();
    }
}