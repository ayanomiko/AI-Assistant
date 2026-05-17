package com.aria.assistant;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PhoneSkills")
public class PhoneSkillsPlugin extends Plugin {

    @PluginMethod
    public void call(PluginCall pluginCall) {
        pluginCall.resolve();
    }

    @PluginMethod
    public void sendSms(PluginCall call) {
        call.resolve();
    }
}