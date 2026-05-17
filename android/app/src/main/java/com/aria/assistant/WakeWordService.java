package com.aria.assistant;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import androidx.core.app.NotificationCompat;

import java.util.ArrayList;
import java.util.Locale;
import java.util.Random;

public class WakeWordService extends Service implements RecognitionListener {

    private static final String CHANNEL_ID = "mei_wakeword_channel";
    private static final int    NOTIF_ID   = 1002;

    // Accepted trigger phrases (lowercase)
    private static final String[] TRIGGERS = { "hey mei", "này mei", "hei mei", "ê mei", "ơi mei" };

    // Responses Mei nói khi được gọi
    private static final String[] RESPONSES = {
        "Dạ, em đây~",
        "Vâng anh~",
        "Em nghe anh rồi ♡",
        "Dạ? Anh cần gì không~",
        "Em đây, anh gọi em à~",
    };

    private SpeechRecognizer recognizer;
    private TextToSpeech     tts;
    private boolean          ttsReady  = false;
    private boolean          listening = false;
    private boolean          stopping  = false;
    private final Random     random    = new Random();

    // ── Lifecycle ──────────────────────────────────────────

    @Override
    public void onCreate() {
        super.onCreate();
        startForeground(NOTIF_ID, buildNotification());
        initTts();
        startListening();
    }

    private void initTts() {
        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                tts.setLanguage(new Locale("vi", "VN"));
                tts.setSpeechRate(1.05f);
                tts.setPitch(1.2f);
                ttsReady = true;
            }
        });
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        stopping = true;
        if (recognizer != null) {
            recognizer.destroy();
            recognizer = null;
        }
        if (tts != null) {
            tts.stop();
            tts.shutdown();
            tts = null;
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    // ── Speech recognition ────────────────────────────────

    private void startListening() {
        if (stopping || !SpeechRecognizer.isRecognitionAvailable(this)) return;

        if (recognizer != null) {
            recognizer.destroy();
        }
        recognizer = SpeechRecognizer.createSpeechRecognizer(this);
        recognizer.setRecognitionListener(this);

        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "vi-VN");
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "vi-VN");
        intent.putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE_RESULTS, false);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);
        // Keep listening even during silence
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 500L);
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 1500L);
        intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 1000L);

        recognizer.startListening(intent);
        listening = true;
    }

    private void restartAfterDelay(long delayMs) {
        if (stopping) return;
        new android.os.Handler(android.os.Looper.getMainLooper())
                .postDelayed(this::startListening, delayMs);
    }

    // ── Wake word detection ───────────────────────────────

    private boolean containsTrigger(String text) {
        String lower = text.toLowerCase(Locale.ROOT);
        for (String t : TRIGGERS) {
            if (lower.contains(t)) return true;
        }
        return false;
    }

    private void onWakeWordDetected() {
        Intent launch = new Intent(this, MainActivity.class);
        launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        launch.putExtra("from_wake_word", true);
        startActivity(launch);
    }

    // ── RecognitionListener callbacks ─────────────────────

    @Override
    public void onResults(Bundle results) {
        listening = false;
        ArrayList<String> matches =
                results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (matches != null) {
            for (String m : matches) {
                if (containsTrigger(m)) {
                    onWakeWordDetected();
                    break;
                }
            }
        }
        restartAfterDelay(300);
    }

    @Override
    public void onError(int error) {
        listening = false;
        // Retry quickly for transient errors, longer for resource errors
        long delay = (error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY
                   || error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS)
                ? 3000L : 800L;
        restartAfterDelay(delay);
    }

    @Override public void onReadyForSpeech(Bundle params)  {}
    @Override public void onBeginningOfSpeech()            {}
    @Override public void onRmsChanged(float rmsdB)        {}
    @Override public void onBufferReceived(byte[] buffer)  {}
    @Override public void onEndOfSpeech()                  {}
    @Override public void onPartialResults(Bundle partial) {}
    @Override public void onEvent(int type, Bundle params) {}

    // ── Notification ──────────────────────────────────────

    private Notification buildNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "Mei Wake Word", NotificationManager.IMPORTANCE_MIN);
            ch.setShowBadge(false);
            ch.setSound(null, null);
            getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }

        Intent tap = new Intent(this, MainActivity.class);
        tap.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        int flags = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                ? PendingIntent.FLAG_IMMUTABLE : 0;
        PendingIntent pi = PendingIntent.getActivity(this, 0, tap, flags);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Mei đang lắng nghe ♡")
                .setContentText("Nói \"Hey Mei\" để gọi em~")
                .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                .setContentIntent(pi)
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .setOngoing(true)
                .build();
    }
}
