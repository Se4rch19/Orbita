package com.orbita.minigame;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;

@CapacitorPlugin(name = "ProgressStore")
public class ProgressStorePlugin extends Plugin {
    private SharedPreferences prefs() { return getContext().getSharedPreferences("orbita_progress", Context.MODE_PRIVATE); }
    private boolean valid(String value) {
        try { JSONObject s = new JSONObject(value); return s.getInt("version") == 3 && s.has("totalLights") && s.has("universe"); }
        catch (Exception e) { return false; }
    }
    @PluginMethod public void read(PluginCall call) {
        JSObject result = new JSObject();
        result.put("current", prefs().getString("current", ""));
        result.put("backup", prefs().getString("backup", ""));
        result.put("debug", (getContext().getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0);
        call.resolve(result);
    }
    @PluginMethod public void write(PluginCall call) {
        String value = call.getString("json", "");
        if (value.length() > 524288 || !valid(value)) { call.reject("Invalid progress data"); return; }
        SharedPreferences p = prefs(); String old = p.getString("current", "");
        SharedPreferences.Editor editor = p.edit();
        if (Boolean.TRUE.equals(call.getBoolean("reset", false))) editor.clear();
        else if (valid(old)) editor.putString("backup", old);
        editor.putString("current", value);
        if (editor.commit()) call.resolve(); else call.reject("Progress could not be saved");
    }
}
