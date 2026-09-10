package com.orbita.minigame;

import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import androidx.core.view.*;

@CapacitorPlugin(name = "Immersion")
public class ImmersionPlugin extends Plugin {
    @PluginMethod public void restore(PluginCall call) {
        getActivity().runOnUiThread(() -> { ((MainActivity)getActivity()).restoreImmersion(); call.resolve(); });
    }
    @PluginMethod public void state(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            JSObject r = new JSObject();
            WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(getActivity().getWindow().getDecorView());
            if(insets != null) {
                r.put("statusVisible", insets.isVisible(WindowInsetsCompat.Type.statusBars()));
                r.put("navigationVisible", insets.isVisible(WindowInsetsCompat.Type.navigationBars()));
                r.put("keyboardVisible", insets.isVisible(WindowInsetsCompat.Type.ime()));
            }
            call.resolve(r);
        });
    }
}
