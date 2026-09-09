package com.orbita.minigame;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(android.os.Bundle state) {
        registerPlugin(ProgressStorePlugin.class);
        super.onCreate(state);
    }
}
