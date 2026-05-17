package com.aria.assistant;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WakeWord")
public class WakeWordPlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        call.resolve();
    }
}