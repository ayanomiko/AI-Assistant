package com.aria.assistant;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "FloatingBubble")
public class FloatingBubblePlugin extends Plugin {

    @PluginMethod
    public void show(PluginCall call) {
        call.resolve();
    }

    @PluginMethod
    public void hide(PluginCall call) {
        call.resolve();
    }
}