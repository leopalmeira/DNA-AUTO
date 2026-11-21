/**
 * DNA AUTO - adiciona GPS nativo em primeiro plano, armazenamento offline
 * e alertas locais do Android ao APK do cliente durante o build.
 * Nenhuma coordenada é transmitida; somente resumos de viagens no próximo sync.
 */
const fs = require('fs');
const path = require('path');

module.exports = function installNativeMileage(pkg, androidRoot) {
  const javaDir = path.join(androidRoot, 'app', 'src', 'main', 'java', ...pkg.split('.'));
  fs.mkdirSync(javaDir, { recursive: true });
  const write = (name, body) => fs.writeFileSync(path.join(javaDir, name), body.replaceAll('PACKAGE_DNA', pkg));

  write('DnaMileagePlugin.java', `package PACKAGE_DNA;
import android.Manifest;
import android.content.Intent;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "DnaMileage")
public class DnaMileagePlugin extends Plugin {
    private SharedPreferences prefs() {
        return getContext().getSharedPreferences("dna_mileage_native", Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void configure(PluginCall call) {
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        String plate = call.getString("plate", "").trim().toUpperCase();
        if (enabled && !plate.matches("[A-Z0-9-]{5,12}")) {
            call.reject("Cadastre e selecione a placa do veículo antes de ativar o GPS.");
            return;
        }
        if (enabled && ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            call.reject("Autorize a localização precisa nas permissões do Android.");
            return;
        }
        if (enabled && Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            call.reject("Autorize as notificações do DNA AUTO nas configurações do Android.");
            return;
        }

        SharedPreferences p = prefs();
        String previousPlate = p.getString("plate", "");
        String previousConfirmedAt = p.getString("confirmedAt", "");
        String confirmedAt = call.getString("confirmedAt", "");
        double official = call.getDouble("officialKm", 0.0);
        double target = call.getDouble("targetKm", 0.0);
        if (official < 0 || official > 20000000 || target < 0 || target > 20000000) {
            call.reject("Quilometragem inválida.");
            return;
        }
        boolean reset = !previousPlate.equals(plate) || (!confirmedAt.isEmpty() && !confirmedAt.equals(previousConfirmedAt));
        SharedPreferences.Editor edit = p.edit();
        if (reset) {
            edit.putFloat("trackedKm", 0f);
            edit.putFloat("tripKm", 0f);
            edit.putLong("tripStart", 0L);
            edit.putString("pendingTrips", "[]");
            edit.putBoolean("alert80", false);
            edit.putBoolean("alert50", false);
            edit.putBoolean("confirmRequired", false);
            edit.remove("lastLat").remove("lastLon").remove("lastTime");
        }
        edit.putString("plate", plate).putString("confirmedAt", confirmedAt)
            .putFloat("officialKm", (float) official).putFloat("targetKm", (float) target)
            .putBoolean("enabled", enabled).apply();

        Intent i = new Intent(getContext(), DnaMileageService.class);
        try {
            if (enabled) {
                ContextCompat.startForegroundService(getContext(), i);
            } else {
                getContext().stopService(i);
            }
        } catch (Exception e) {
            prefs().edit().putBoolean("enabled", false).apply();
            call.reject("O Android impediu o início do monitoramento: " + e.getMessage());
            return;
        }
        JSObject result = new JSObject();
        result.put("enabled", enabled);
        result.put("reset", reset);
        call.resolve(result);
    }

    @PluginMethod
    public void getState(PluginCall call) {
        SharedPreferences p = prefs();
        JSObject out = new JSObject();
        out.put("enabled", p.getBoolean("enabled", false));
        out.put("plate", p.getString("plate", ""));
        out.put("officialKm", p.getFloat("officialKm", 0));
        out.put("estimatedKm", p.getFloat("officialKm", 0) + p.getFloat("trackedKm", 0) + p.getFloat("tripKm", 0));
        out.put("confirmRequired", p.getBoolean("confirmRequired", false));
        out.put("lastFixAt", p.getLong("lastTime", 0L));
        try {
            out.put("trips", new JSONArray(p.getString("pendingTrips", "[]")));
        } catch (Exception e) {
            out.put("trips", new JSONArray());
        }
        call.resolve(out);
    }

    @PluginMethod
    public void acknowledgeTrips(PluginCall call) {
        JSArray ids = call.getArray("ids");
        if (ids == null) { call.reject("IDs ausentes."); return; }
        try {
            JSONArray queue = new JSONArray(prefs().getString("pendingTrips", "[]"));
            JSONArray remaining = new JSONArray();
            for (int i = 0; i < queue.length(); i++) {
                JSONObject t = queue.getJSONObject(i);
                boolean found = false;
                for (int j = 0; j < ids.length(); j++) {
                    if (t.optString("id").equals(ids.optString(j))) { found = true; break; }
                }
                if (!found) remaining.put(t);
            }
            prefs().edit().putString("pendingTrips", remaining.toString()).apply();
            call.resolve();
        } catch (Exception ex) { call.reject("Falha ao confirmar sincronização.", ex); }
    }

    @PluginMethod
    public void acknowledgeOdometer(PluginCall call) {
        // Apenas após confirmação da leitura real no servidor.
        prefs().edit().putBoolean("confirmRequired", false).apply();
        call.resolve();
    }
}
`);

  write('DnaMileageService.java', `package PACKAGE_DNA;
import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Locale;
import java.util.UUID;

public class DnaMileageService extends Service implements LocationListener {
    static final String CHANNEL_ACTIVE = "dna_gps_monitor";
    static final String CHANNEL_ALERT = "dna_mileage_maintenance";
    static final int ACTIVE_NOTIFICATION = 4201;
    static final int ALERT_NOTIFICATION = 4202;
    private SharedPreferences prefs;
    private LocationManager manager;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable idleCheck = new Runnable() {
        @Override public void run() {
            long last = prefs.getLong("lastTime", 0);
            if (prefs.getLong("tripStart", 0) > 0 && last > 0 && System.currentTimeMillis() - last > 180000) {
                finishTrip();
            }
            handler.postDelayed(this, 60000);
        }
    };

    @Override public void onCreate() {
        super.onCreate();
        prefs = getSharedPreferences("dna_mileage_native", Context.MODE_PRIVATE);
        createChannels();
        startForeground(ACTIVE_NOTIFICATION, ongoingNotification());
        handler.postDelayed(idleCheck, 60000);
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (!prefs.getBoolean("enabled", false) || !canAccessLocation()) {
            stopSelf();
            return START_NOT_STICKY;
        }
        if (manager == null) {
            manager = (LocationManager) getSystemService(LOCATION_SERVICE);
            try {
                if (manager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                    manager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 20000L, 30f, this, Looper.getMainLooper());
                }
                if (manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    manager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 45000L, 60f, this, Looper.getMainLooper());
                }
            } catch (SecurityException ignored) {
                stopSelf();
                return START_NOT_STICKY;
            } catch (IllegalArgumentException ignored) { }
        }
        return START_STICKY;
    }

    private boolean canAccessLocation() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    @Override public void onLocationChanged(Location location) {
        if (!prefs.getBoolean("enabled", false) || location == null || !location.hasAccuracy() || location.getAccuracy() > 35f) return;
        if (Build.VERSION.SDK_INT >= 18 && location.isFromMockProvider()) return;
        long now = location.getTime() > 0 ? location.getTime() : System.currentTimeMillis();
        long oldTime = prefs.getLong("lastTime", 0);
        boolean hadPrevious = prefs.contains("lastLat") && prefs.contains("lastLon") && oldTime > 0;
        double distance = 0;
        double speedKmh = location.hasSpeed() ? location.getSpeed() * 3.6 : 0;
        double elapsed = (now - oldTime) / 1000.0;
        if (hadPrevious && elapsed >= 2 && elapsed <= 600) {
            float[] out = new float[1];
            Location.distanceBetween(prefs.getFloat("lastLat", 0), prefs.getFloat("lastLon", 0),
                location.getLatitude(), location.getLongitude(), out);
            distance = out[0];
            double computed = distance / elapsed * 3.6;
            if (!location.hasSpeed()) speedKmh = computed;
            if (computed > 160 || speedKmh > 160) return;
            if (distance < 5) distance = 0;
        } else if (hadPrevious && elapsed > 600 && prefs.getLong("tripStart", 0L) > 0) {
            finishTrip();
        }
        SharedPreferences.Editor edit = prefs.edit();
        edit.putFloat("lastLat", (float) location.getLatitude())
            .putFloat("lastLon", (float) location.getLongitude())
            .putLong("lastTime", now);
        long tripStart = prefs.getLong("tripStart", 0L);
        if (tripStart == 0 && speedKmh >= 12) {
            edit.putLong("tripStart", now).putFloat("tripKm", 0f)
                .putInt("tripSamples", 1).putInt("tripAccurateSamples", 1)
                .putFloat("speedSum", (float) speedKmh).putFloat("speedMax", (float) speedKmh);
        } else if (tripStart > 0 && elapsed > 0 && elapsed <= 600) {
            edit.putFloat("tripKm", prefs.getFloat("tripKm", 0f) + (float) (distance / 1000.0));
            edit.putInt("tripSamples", prefs.getInt("tripSamples", 0) + 1);
            if (location.getAccuracy() <= 25) edit.putInt("tripAccurateSamples", prefs.getInt("tripAccurateSamples", 0) + 1);
            edit.putFloat("speedSum", prefs.getFloat("speedSum", 0) + (float) speedKmh);
            edit.putFloat("speedMax", Math.max(prefs.getFloat("speedMax", 0), (float) speedKmh));
        }
        edit.apply();
        checkMileageThresholds();
    }

    private synchronized void finishTrip() {
        long start = prefs.getLong("tripStart", 0L);
        float km = prefs.getFloat("tripKm", 0f);
        int count = prefs.getInt("tripSamples", 0);
        int duration = (int) Math.max(0, (prefs.getLong("lastTime", start) - start) / 1000);
        if (start > 0 && km >= 0.15f && duration >= 60 && count >= 3) {
            try {
                JSONArray items = new JSONArray(prefs.getString("pendingTrips", "[]"));
                JSONObject t = new JSONObject();
                t.put("id", "native_" + UUID.randomUUID().toString());
                t.put("start_time", new java.util.Date(start).toInstant().toString());
                t.put("end_time", new java.util.Date(prefs.getLong("lastTime", start)).toInstant().toString());
                t.put("duration_seconds", duration);
                t.put("distance_km", Math.round(km * 100.0) / 100.0);
                t.put("samples_count", count);
                t.put("samples_high_accuracy", prefs.getInt("tripAccurateSamples", 0));
                t.put("avg_speed_kmh", Math.round(prefs.getFloat("speedSum", 0) / Math.max(1, count) * 10.0) / 10.0);
                t.put("max_speed_kmh", prefs.getFloat("speedMax", 0));
                t.put("bluetooth_connected", false);
                t.put("accelerometer_profile", "UNKNOWN");
                items.put(t);
                prefs.edit().putString("pendingTrips", items.toString())
                    .putFloat("trackedKm", prefs.getFloat("trackedKm", 0) + km).apply();
            } catch (Exception ignored) { }
        }
        prefs.edit().putLong("tripStart", 0).putFloat("tripKm", 0)
            .putInt("tripSamples", 0).putInt("tripAccurateSamples", 0)
            .putFloat("speedSum", 0).putFloat("speedMax", 0).apply();
    }

    private void checkMileageThresholds() {
        float target = prefs.getFloat("targetKm", 0f);
        if (target <= 0f) return;
        float estimate = prefs.getFloat("officialKm", 0f) + prefs.getFloat("trackedKm", 0f) + prefs.getFloat("tripKm", 0f);
        float remaining = target - estimate;
        if (remaining <= 50f && !prefs.getBoolean("alert50", false)) {
            prefs.edit().putBoolean("alert50", true).putBoolean("confirmRequired", true).apply();
            alert("DNA AUTO: confirme a quilometragem", "Faltam cerca de " + Math.max(0, Math.round(remaining)) + " km para a manutenção. Abra o DNA AUTO e informe o km real do painel.");
        } else if (remaining <= 80f && !prefs.getBoolean("alert80", false)) {
            prefs.edit().putBoolean("alert80", true).apply();
            alert("DNA AUTO: manutenção próxima", "Estimativa de " + Math.max(0, Math.round(remaining)) + " km até a manutenção. Confira o hodômetro do veículo.");
        }
    }

    private void createChannels() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            NotificationChannel regular = new NotificationChannel(CHANNEL_ACTIVE, "GPS e quilometragem DNA AUTO", NotificationManager.IMPORTANCE_LOW);
            regular.setDescription("Monitoramento de viagens autorizado pelo proprietário.");
            NotificationChannel alert = new NotificationChannel(CHANNEL_ALERT, "Alertas de manutenção DNA AUTO", NotificationManager.IMPORTANCE_HIGH);
            alert.enableVibration(true);
            nm.createNotificationChannel(regular);
            nm.createNotificationChannel(alert);
        }
    }

    private PendingIntent openAppIntent() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private Notification ongoingNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_ACTIVE)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentTitle("DNA AUTO — Monitoramento ativo")
            .setContentText("Estimando quilômetros de viagens. Toque para abrir ou pause no aplicativo.")
            .setContentIntent(openAppIntent()).setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW).build();
    }

    private void alert(String title, String message) {
        Notification n = new NotificationCompat.Builder(this, CHANNEL_ALERT)
            .setSmallIcon(android.R.drawable.ic_dialog_alert).setContentTitle(title)
            .setContentText(message).setStyle(new NotificationCompat.BigTextStyle().bigText(message))
            .setAutoCancel(true).setContentIntent(openAppIntent())
            .setPriority(NotificationCompat.PRIORITY_HIGH).setDefaults(Notification.DEFAULT_SOUND | Notification.DEFAULT_VIBRATE).build();
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        nm.notify(ALERT_NOTIFICATION, n);
    }

    @Override public void onDestroy() {
        handler.removeCallbacks(idleCheck);
        if (manager != null) { try { manager.removeUpdates(this); } catch (Exception ignored) { } }
        finishTrip();
        super.onDestroy();
    }
    @Override public IBinder onBind(Intent intent) { return null; }
}
`);

  write('DnaMileageBootReceiver.java', `package PACKAGE_DNA;
import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.content.ContextCompat;

public class DnaMileageBootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        if (!Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) return;
        if (!context.getSharedPreferences("dna_mileage_native", Context.MODE_PRIVATE).getBoolean("enabled", false)) return;
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) return;
        if (Build.VERSION.SDK_INT >= 29 &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_BACKGROUND_LOCATION) != PackageManager.PERMISSION_GRANTED) return;
        try {
            ContextCompat.startForegroundService(context, new Intent(context, DnaMileageService.class));
        } catch (Exception ignored) {
            // Android pode restringir início de foreground service após reinicialização.
            // Nesse caso o aplicativo precisa ser aberto para reativação.
        }
    }
}
`);
};
