const fs = require('fs');
const path = require('path');

const target = process.argv[2] || 'cliente';
const isOficina = target === 'oficina';

const serverUrl = (process.env.INPUT_SERVER_URL || 'https://dna-auto-byin.onrender.com').replace(/\/$/, '');
const versionName = process.env.INPUT_VERSION_NAME || '2.5.6';
const versionCode = process.env.INPUT_VERSION_CODE || '256';
const host = new URL(serverUrl).hostname;

const pkg = isOficina ? 'br.com.dnaauto.oficina' : 'br.com.dnaauto.cliente';
const pkgPath = pkg.replace(/\./g, '/');
const pathPrefix = isOficina ? '/oficina' : '/cliente';
const customScheme = isOficina ? 'dnaoficina' : 'dnaauto';
const navBarColor = isOficina ? '#010712' : '#020712';

// Corrige versão anunciada pelo APK na URL interna e no User-Agent ANTES do cap sync.
// Assim, o novo APK não continuará se identificando como a versão 2.5.4.
const configPath = path.join(process.cwd(), 'capacitor.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
config.server.url = serverUrl + pathPrefix + '?apk_version=' + encodeURIComponent(versionName) + '&apk_code=' + encodeURIComponent(versionCode);
config.android.appendUserAgent = (isOficina ? 'DNAOficinaAPK/' : 'DNAAutoAPK/') + versionName;
fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
packageJson.version = versionName;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

const fallbackIndexPath = path.join(process.cwd(), 'www', 'index.html');
if (fs.existsSync(fallbackIndexPath)) {
  const fallbackHtml = fs.readFileSync(fallbackIndexPath, 'utf8')
    .replace(/apk_version=[0-9.]+&apk_code=[0-9]+/g, 'apk_version=' + versionName + '&apk_code=' + versionCode);
  fs.writeFileSync(fallbackIndexPath, fallbackHtml);
}

if (process.argv.includes('--config-only')) {
  console.log('Capacitor config sincronizado: ' + target + ' v' + versionName + ' (' + versionCode + ')');
  process.exit(0);
}
// 1. versionCode / versionName no build.gradle
const gradlePath = path.join(process.cwd(), 'android', 'app', 'build.gradle');
let gradle = fs.readFileSync(gradlePath, 'utf8');
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${versionName}"`);
fs.writeFileSync(gradlePath, gradle);

// 2. Permissões, Deep Links e Edge-to-Edge no AndroidManifest.xml
const manifestPath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
let xml = fs.readFileSync(manifestPath, 'utf8');

const perms = isOficina
  ? [
      '<uses-permission android:name="android.permission.CAMERA" />',
      '<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />'
    ]
  : [
      '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
      '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
      '<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />',
      '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
      '<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />',
      '<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />',
      '<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />',
      '<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />'
    ];

const missingPerms = perms.filter((p) => !xml.includes(p)).join('\n    ');
if (missingPerms) {
  xml = xml.replace('<application', `${missingPerms}\n    <application`);
}

const deepLinks = [
  `<intent-filter android:autoVerify="true">`,
  `  <action android:name="android.intent.action.VIEW" />`,
  `  <category android:name="android.intent.category.DEFAULT" />`,
  `  <category android:name="android.intent.category.BROWSABLE" />`,
  `  <data android:scheme="https" android:host="${host}" android:pathPrefix="${pathPrefix}" />`,
  `</intent-filter>`,
  `<intent-filter>`,
  `  <action android:name="android.intent.action.VIEW" />`,
  `  <category android:name="android.intent.category.DEFAULT" />`,
  `  <category android:name="android.intent.category.BROWSABLE" />`,
  `  <data android:scheme="${customScheme}" android:host="open" />`,
  `</intent-filter>`
].join('\n            ');

if (!xml.includes(`android:scheme="${customScheme}"`)) {
  xml = xml.replace('</activity>', `${deepLinks}\n        </activity>`);
}

if (!xml.includes('asset_statements')) {
  xml = xml.replace(
    '</application>',
    '    <meta-data android:name="asset_statements" android:resource="@string/asset_statements" />\n    </application>'
  );
}
if (!isOficina && !xml.includes('android:name=".DnaMileageService"')) {
  xml = xml.replace('</application>', `
    <service android:name=".DnaMileageService" android:foregroundServiceType="location" android:exported="false" />
    <receiver android:name=".DnaMileageBootReceiver" android:enabled="true" android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
      </intent-filter>
    </receiver>
  </application>`);
}
fs.writeFileSync(manifestPath, xml);

// 3. strings.xml com asset_statements
const stringsPath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');
let stringsXml = fs.readFileSync(stringsPath, 'utf8');
if (!stringsXml.includes('asset_statements')) {
  const stmt = JSON.stringify([{ include: `${serverUrl}/.well-known/assetlinks.json` }]).replace(/"/g, '\\"');
  stringsXml = stringsXml.replace(
    '</resources>',
    `    <string name="asset_statements">${stmt}</string>\n</resources>`
  );
  fs.writeFileSync(stringsPath, stringsXml);
}

// 4. styles.xml transparente / edge-to-edge
const stylesPath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res', 'values', 'styles.xml');
if (fs.existsSync(stylesPath)) {
  let styles = fs.readFileSync(stylesPath, 'utf8');
  const launchStyle = /(<style name="AppTheme\.NoActionBarLaunch"[^>]*>)[\s\S]*?(<\/style>)/;
  if (!launchStyle.test(styles)) {
    throw new Error('Capacitor launch style not found in styles.xml');
  }
  // Keep the Capacitor launch theme and remove its stock logo drawable.
  styles = styles.replace(launchStyle, (_, open, close) => [
    open,
    `        <item name="android:windowBackground">${navBarColor}</item>`,
    `        <item name="android:navigationBarColor">${navBarColor}</item>`,
    '        <item name="android:windowLightNavigationBar">false</item>',
    `        <item name="windowSplashScreenBackground">${navBarColor}</item>`,
    '        <item name="windowSplashScreenAnimatedIcon">@android:color/transparent</item>',
    '        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>',
    '    ' + close
  ].join('\n'));

  if (!styles.includes('windowTranslucentStatus')) {
    styles = styles.replace(
      '<item name="windowNoTitle">true</item>',
      [
        '<item name="windowNoTitle">true</item>',
        '        <item name="android:windowTranslucentStatus">true</item>',
        '        <item name="android:statusBarColor">@android:color/transparent</item>'
      ].join('\n')
    );
  }
  fs.writeFileSync(stylesPath, styles);
}

// 5. MainActivity.java com Edge-to-Edge WindowCompat e notch shortEdges
const mainActivityPath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'java', ...pkgPath.split('/'), 'MainActivity.java');
const rawResources = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res', 'raw');
fs.mkdirSync(rawResources, { recursive: true });
fs.copyFileSync(path.join(__dirname, 'android', 'startup.mp4'), path.join(rawResources, 'dna_startup.mp4'));

fs.writeFileSync(mainActivityPath, [
  `package ${pkg};`,
  '',
  'import android.graphics.Color;',
  'import android.graphics.SurfaceTexture;',
  'import android.media.MediaPlayer;',
  'import android.view.Surface;',
  'import android.view.TextureView;',
  'import android.os.Handler;',
  'import android.os.Looper;',
  'import android.view.Gravity;',
  'import android.view.ViewGroup;',
  'import android.widget.FrameLayout;',
  'import android.os.Build;',
  'import android.os.Bundle;',
  'import android.view.View;',
  'import android.view.WindowManager;',
  'import androidx.core.view.WindowCompat;',
  ...(isOficina ? [] : [
    'import android.Manifest;',
    'import android.content.pm.PackageManager;',
    'import androidx.core.app.ActivityCompat;',
    'import androidx.core.content.ContextCompat;'
  ]),
  'import androidx.core.view.WindowInsetsCompat;',
  'import androidx.core.view.WindowInsetsControllerCompat;',
  'import com.getcapacitor.BridgeActivity;',
  '',
  'public class MainActivity extends BridgeActivity {',
  '    private final Handler startupHandler = new Handler(Looper.getMainLooper());',
  '    private FrameLayout startupOverlay;',
  '    private TextureView startupVideo;',
  '    private MediaPlayer startupPlayer;',
  '    private boolean startupPlaybackComplete;',
  '    private boolean requestedNotificationPermission;',
  '    private boolean startupReady;',
  '    private final Runnable startupPlaybackTimeout = this::finishStartupVideo;',
  '',
  '    @Override',
  '    protected void onCreate(Bundle savedInstanceState) {',
  ...(isOficina ? [] : ['        registerPlugin(DnaMileagePlugin.class);']),
  '        super.onCreate(savedInstanceState);',
  `        getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(Color.parseColor("${navBarColor}")));`,
  '        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);',
  '        getWindow().setStatusBarColor(Color.TRANSPARENT);',
  `        getWindow().setNavigationBarColor(Color.parseColor("${navBarColor}"));`,
  '        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {',
  '            WindowManager.LayoutParams lp = getWindow().getAttributes();',
  '            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;',
  '            getWindow().setAttributes(lp);',
  '        }',
  '        View decor = getWindow().getDecorView();',
  '        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), decor);',
  '        if (controller != null) {',
  '            controller.setAppearanceLightStatusBars(false);',
  '        }',
  '        showStartupVideo();',
  '    }',
  '',
  '    @Override',
  '    public void onRestart() {',
  '        super.onRestart();',
  '        showStartupVideo();',
  '    }',
  '',
  '    private void showStartupVideo() {',
  '        if (startupOverlay != null || getBridge() == null) return;',
  '        startupReady = false;',
  '        startupPlaybackComplete = false;',
  '        WindowInsetsControllerCompat insets = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());',
  '        insets.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);',
  '        insets.hide(WindowInsetsCompat.Type.systemBars());',
  '        startupOverlay = new FrameLayout(this);',
  `        startupOverlay.setBackgroundColor(Color.parseColor("${navBarColor}"));`,
  '        startupOverlay.setClickable(true);',
  '        startupVideo = new TextureView(this);',
  '        FrameLayout.LayoutParams videoLayout = new FrameLayout.LayoutParams(',
  '            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT, Gravity.CENTER);',
  '        startupOverlay.addView(startupVideo, videoLayout);',
  '        startupVideo.setSurfaceTextureListener(new TextureView.SurfaceTextureListener() {',
  '            @Override public void onSurfaceTextureAvailable(SurfaceTexture texture, int width, int height) {',
  '                playStartupVideo(texture);',
  '            }',
  '            @Override public void onSurfaceTextureSizeChanged(SurfaceTexture texture, int width, int height) {',
  '                if (startupPlayer != null) fitStartupVideo(startupPlayer);',
  '            }',
  '            @Override public boolean onSurfaceTextureDestroyed(SurfaceTexture texture) { return true; }',
  '            @Override public void onSurfaceTextureUpdated(SurfaceTexture texture) {}',
  '        });',
  '        addContentView(startupOverlay, new ViewGroup.LayoutParams(',
  '            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));',
  '        startupHandler.postDelayed(startupPlaybackTimeout, 30000);',
  '        checkStartupReady();',
  '    }',
  '',
  '    private void playStartupVideo(SurfaceTexture texture) {',
  '        MediaPlayer player = MediaPlayer.create(this, R.raw.dna_startup);',
  '        if (player == null) {',
  '            finishStartupVideo();',
  '            return;',
  '        }',
  '        startupPlayer = player;',
  '        Surface surface = new Surface(texture);',
  '        try {',
  '            player.setSurface(surface);',
  '            player.setOnErrorListener((media, what, extra) -> {',
  '                if (media == startupPlayer) {',
  '                    android.util.Log.e("DnaStartup", "Video playback failed: " + what + "/" + extra);',
  '                    finishStartupVideo();',
  '                }',
  '                return true;',
  '            });',
  '            player.setOnVideoSizeChangedListener((media, width, height) -> {',
  '                if (media == startupPlayer) fitStartupVideo(media);',
  '            });',
  '            player.setLooping(false);',
  '            player.setOnCompletionListener(media -> {',
  '                if (media != startupPlayer) return;',
  '                startupPlaybackComplete = true;',
  '                if (startupReady) finishStartupVideo();',
  '            });',
  '            fitStartupVideo(player);',
  '            player.start();',
  '        } catch (IllegalStateException e) {',
  '            android.util.Log.e("DnaStartup", "Video playback failed", e);',
  '            finishStartupVideo();',
  '        } finally {',
  '            surface.release();',
  '        }',
  '    }',
  '',
  '    private void fitStartupVideo(MediaPlayer player) {',
  '        int width = startupVideo.getWidth();',
  '        int height = startupVideo.getHeight();',
  '        int videoWidth = player.getVideoWidth();',
  '        int videoHeight = player.getVideoHeight();',
  '        if (width == 0 || height == 0 || videoWidth == 0 || videoHeight == 0) return;',
  '        float scale = Math.min((float) width / videoWidth, (float) height / videoHeight);',
  '        startupVideo.setScaleX(scale * videoWidth / width);',
  '        startupVideo.setScaleY(scale * videoHeight / height);',
  '    }',
  '',
  '    private void checkStartupReady() {',
  '        if (startupOverlay == null) return;',
  '        if (startupReady && startupPlaybackComplete) {',
  '            finishStartupVideo();',
  '            return;',
  '        }',
  '        FrameLayout overlay = startupOverlay;',
  '        getBridge().getWebView().evaluateJavascript("window.dnaStartupReady === true", ready -> {',
  '            if (startupOverlay != overlay) return;',
  '            startupReady = "true".equals(ready);',
  '            startupHandler.postDelayed(this::checkStartupReady, 120);',
  '        });',
  '    }',
  '',
  '    private void removeStartupVideo() {',
  '        startupHandler.removeCallbacksAndMessages(null);',
  '        if (startupOverlay == null) return;',
  '        if (startupPlayer != null) {',
  '            startupPlayer.release();',
  '            startupPlayer = null;',
  '        }',
  '        ((ViewGroup) startupOverlay.getParent()).removeView(startupOverlay);',
  '        startupOverlay = null;',
  '        startupVideo = null;',
  '        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView()).show(WindowInsetsCompat.Type.systemBars());',
  '    }',
  '',
  '    private void finishStartupVideo() {',
  '        removeStartupVideo();',
  ...(isOficina ? [] : [
    '        if (!requestedNotificationPermission && Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {',
    '            requestedNotificationPermission = true;',
    '            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, 12033);',
    '        }'
  ]),
  '    }',
  '',
  '    @Override',
  '    public void onStop() {',
  '        removeStartupVideo();',
  '        super.onStop();',
  '    }',
  '',
  '    @Override',
  '    public void onDestroy() {',
  '        removeStartupVideo();',
  '        super.onDestroy();',
  '    }',
  '}',
  ''
].join('\n'));

// 6. Ícones Oficiais do Aplicativo (Substitui ícones padrão do Capacitor)
if (isOficina) {
  // Mantém o símbolo do Cliente intocado; os PNGs exclusivos são gerados
  // antes de injetar os recursos no APK da Oficina.
  require('node:child_process').execFileSync(process.execPath,
    [path.join(__dirname,'build-oficina-icons.js')], { stdio: 'inherit' });
}
const sourceIconPath = path.join(__dirname,'..',
  isOficina ? 'oficina.app' : 'cliente.app', 'img', 'icons', 'icon-512x512.png');
const mipmapDirs = [
  'mipmap-mdpi',
  'mipmap-hdpi',
  'mipmap-xhdpi',
  'mipmap-xxhdpi',
  'mipmap-xxxhdpi'
];
if (fs.existsSync(sourceIconPath)) {
  const iconBuffer = fs.readFileSync(sourceIconPath);
  const resDir = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');
  mipmapDirs.forEach((dir) => {
    const targetDir = path.join(resDir, dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), iconBuffer);
    fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), iconBuffer);
    fs.writeFileSync(path.join(targetDir, 'ic_launcher_foreground.png'), iconBuffer);
  });

  const bgXmlPath = path.join(resDir, 'values', 'ic_launcher_background.xml');
  if (fs.existsSync(path.dirname(bgXmlPath))) {
    fs.writeFileSync(bgXmlPath, `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${navBarColor}</color>\n</resources>\n`);
  }
  console.log(`✅ Ícones oficiais injetados nos mipmaps Android a partir de ${sourceIconPath}`);
}

console.log(`✅ Android project patched for ${target} (${pkg} v${versionName} code ${versionCode})`);

// Serviço independente da WebView, apenas no APK do cliente.
if (!isOficina) require('./dna-mileage-android')(pkg, path.join(process.cwd(), 'android'));
