package com.aria.assistant;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.IBinder;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;

import androidx.core.app.NotificationCompat;

public class FloatingBubbleService extends Service {

    private static final String CHANNEL_ID   = "mei_bubble_channel";
    private static final int    NOTIF_ID     = 1001;
    private static final int    OVERLAY_TYPE = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;

    private WindowManager            windowManager;
    private View                     bubbleView;
    private WindowManager.LayoutParams params;

    // Touch tracking
    private int   startX, startY;
    private float startRawX, startRawY;
    private long  touchDownMs;

    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        startForeground(NOTIF_ID, buildNotification());
        createBubble();
    }

    private void createBubble() {
        // Bubble view: simple emoji TextView styled as circle
        TextView tv = new TextView(this);
        tv.setText("🌸");
        tv.setTextSize(26f);
        tv.setGravity(Gravity.CENTER);
        tv.setBackground(getResources().getDrawable(R.drawable.bubble_bg, null));

        params = new WindowManager.LayoutParams(
                dpToPx(60), dpToPx(60),
                OVERLAY_TYPE,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.TOP | Gravity.START;
        params.x = getScreenWidth() - dpToPx(68);
        params.y = (int) (getScreenHeight() * 0.60f);

        tv.setOnTouchListener((v, event) -> {
            switch (event.getAction()) {
                case MotionEvent.ACTION_DOWN:
                    startX     = params.x;
                    startY     = params.y;
                    startRawX  = event.getRawX();
                    startRawY  = event.getRawY();
                    touchDownMs = System.currentTimeMillis();
                    return true;

                case MotionEvent.ACTION_MOVE:
                    params.x = startX + (int) (event.getRawX() - startRawX);
                    params.y = startY + (int) (event.getRawY() - startRawY);
                    windowManager.updateViewLayout(bubbleView, params);
                    return true;

                case MotionEvent.ACTION_UP:
                    long dt  = System.currentTimeMillis() - touchDownMs;
                    float dx = Math.abs(event.getRawX() - startRawX);
                    float dy = Math.abs(event.getRawY() - startRawY);

                    if (dt < 250 && dx < 12 && dy < 12) {
                        openMainApp(); // tap → mở app
                    } else {
                        snapToEdge();  // drag xong → snap vào cạnh
                    }
                    return true;
            }
            return false;
        });

        bubbleView = tv;
        windowManager.addView(bubbleView, params);
    }

    private void openMainApp() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
    }

    private void snapToEdge() {
        int mid = getScreenWidth() / 2;
        params.x = (params.x + dpToPx(30) < mid) ? dpToPx(8) : getScreenWidth() - dpToPx(68);
        windowManager.updateViewLayout(bubbleView, params);
    }

    private Notification buildNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "Mei AI Bubble", NotificationManager.IMPORTANCE_LOW);
            ch.setShowBadge(false);
            getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }

        Intent tapIntent = new Intent(this, MainActivity.class);
        tapIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                ? PendingIntent.FLAG_IMMUTABLE : 0;
        PendingIntent pi = PendingIntent.getActivity(this, 0, tapIntent, flags);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Mei đang ở đây ♡")
                .setContentText("Em đang theo dõi anh~ Nhấn để mở")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentIntent(pi)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
                .build();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY; // tự khởi động lại nếu bị kill
    }

    @Override
    public void onDestroy() {
        if (bubbleView != null) {
            windowManager.removeView(bubbleView);
            bubbleView = null;
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    // ── Helpers ──────────────────────────────────────────
    private int dpToPx(int dp) {
        return Math.round(dp * getResources().getDisplayMetrics().density);
    }

    private int getScreenWidth() {
        DisplayMetrics dm = new DisplayMetrics();
        windowManager.getDefaultDisplay().getMetrics(dm);
        return dm.widthPixels;
    }

    private int getScreenHeight() {
        DisplayMetrics dm = new DisplayMetrics();
        windowManager.getDefaultDisplay().getMetrics(dm);
        return dm.heightPixels;
    }
}
