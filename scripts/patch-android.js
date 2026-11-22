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
  if (!styles.includes('windowTranslucentStatus')) {
    styles = styles.replace(
      '<item name="windowNoTitle">true</item>',
      [
        '<item name="windowNoTitle">true</item>',
        '        <item name="android:windowTranslucentStatus">true</item>',
        '        <item name="android:statusBarColor">@android:color/transparent</item>'
      ].join('\n')
    );
    fs.writeFileSync(stylesPath, styles);
  }
}

// 5. MainActivity.java com Edge-to-Edge WindowCompat e notch shortEdges
const mainActivityPath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'java', ...pkgPath.split('/'), 'MainActivity.java');
fs.writeFileSync(mainActivityPath, [
  `package ${pkg};`,
  '',
  'import android.graphics.Color;',
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
  'import androidx.core.view.WindowInsetsControllerCompat;',
  'import com.getcapacitor.BridgeActivity;',
  '',
  'public class MainActivity extends BridgeActivity {',
  '    @Override',
  '    protected void onCreate(Bundle savedInstanceState) {',
  ...(isOficina ? [] : ['        registerPlugin(DnaMileagePlugin.class);', '        registerPlugin(DnaPushPlugin.class);']),
  '        super.onCreate(savedInstanceState);',
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
  ...(isOficina ? [] : [
    '        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {',
    '            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, 12033);',
    '        }'
  ]),
  '    }',
  '}',
  ''
].join('\n'));

// 6. Ícones Oficiais do Aplicativo (Substitui ícones padrão do Capacitor)
const sourceIconPath = path.join(__dirname, '..', 'cliente.app', 'img', 'icons', 'icon-512x512.png');
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
if (!isOficina) require('./dna-push-android')(pkg, path.join(process.cwd(), 'android'), serverUrl);
