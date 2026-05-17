package com.aria.assistant;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.widget.RemoteViews;

public class MeiWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }

    static void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_mei);

        // Read last Mei message from SharedPreferences
        SharedPreferences prefs = context.getSharedPreferences("mei_widget", Context.MODE_PRIVATE);
        String lastMsg = prefs.getString("last_msg", "Em đang chờ anh~ ♡");
        String status  = prefs.getString("status",   "● Đang hoạt động");

        views.setTextViewText(R.id.widget_msg,    lastMsg);
        views.setTextViewText(R.id.widget_status, status);

        // Tap → open MainActivity
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                ? PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
                : PendingIntent.FLAG_UPDATE_CURRENT;
        PendingIntent pi = PendingIntent.getActivity(context, 0, intent, flags);
        views.setOnClickPendingIntent(R.id.widget_root, pi);

        manager.updateAppWidget(widgetId, views);
    }

    // Called by MeiWidgetPlugin to push fresh content
    public static void pushUpdate(Context context, String msg, String status) {
        context.getSharedPreferences("mei_widget", Context.MODE_PRIVATE)
                .edit()
                .putString("last_msg", msg)
                .putString("status",   status)
                .apply();

        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(
                new android.content.ComponentName(context, MeiWidget.class));
        AppWidgetProvider p = new MeiWidget();
        p.onUpdate(context, manager, ids);
    }
}
