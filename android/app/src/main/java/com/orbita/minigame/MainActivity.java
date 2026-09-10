package com.orbita.minigame;

import com.getcapacitor.BridgeActivity;
import android.os.Build;
import android.view.WindowManager;
import androidx.core.view.*;
import androidx.core.graphics.Insets;
import androidx.core.splashscreen.SplashScreen;

public class MainActivity extends BridgeActivity {
    private boolean keyboardWasVisible = false;
    @Override public void onCreate(android.os.Bundle state) {
        SplashScreen.installSplashScreen(this);
        registerPlugin(ProgressStorePlugin.class);
        registerPlugin(ImmersionPlugin.class);
        super.onCreate(state);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        if(Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams params = getWindow().getAttributes();
            params.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(params);
        }
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        ViewCompat.setOnApplyWindowInsetsListener(bridge.getWebView(), (view, insets) -> {
            Insets cutout = insets.getInsets(WindowInsetsCompat.Type.displayCutout());
            Insets keyboard = insets.getInsets(WindowInsetsCompat.Type.ime());
            view.setPadding(cutout.left, cutout.top, cutout.right, Math.max(cutout.bottom, keyboard.bottom));
            boolean keyboardVisible = insets.isVisible(WindowInsetsCompat.Type.ime());
            if(keyboardWasVisible && !keyboardVisible) view.postDelayed(this::restoreImmersion, 250);
            keyboardWasVisible = keyboardVisible;
            return insets;
        });
        restoreImmersion();
    }
    public void restoreImmersion() {
        if(bridge == null) return;
        WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(bridge.getWebView());
        if(insets != null && insets.isVisible(WindowInsetsCompat.Type.ime())) return;
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }
    @Override public void onWindowFocusChanged(boolean focus) {
        super.onWindowFocusChanged(focus);
        if(focus) restoreImmersion();
    }
}
