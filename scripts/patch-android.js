const fs = require('fs');
const path = require('path');

const target = process.argv[2] || 'cliente';
const isOficina = target === 'oficina';

const serverUrl = (process.env.INPUT_SERVER_URL || 'https://dna-auto-byin.onrender.com').replace(/\/$/, '');
const versionName = process.env.INPUT_VERSION_NAME || '2.5.3';
const versionCode = process.env.INPUT_VERSION_CODE || '253';
const host = new URL(serverUrl).hostname;

const pkg = isOficina ? 'br.com.dnaauto.oficina' : 'br.com.dnaauto.cliente';
const pkgPath = pkg.replace(/\./g, '/');
const pathPrefix = isOficina ? '/oficina' : '/cliente';
const customScheme = isOficina ? 'dnaoficina' : 'dnaauto';
const navBarColor = isOficina ? '#010712' : '#020712';

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
  'import androidx.core.view.WindowInsetsControllerCompat;',
  'import com.getcapacitor.BridgeActivity;',
  '',
  'public class MainActivity extends BridgeActivity {',
  '    @Override',
  '    protected void onCreate(Bundle savedInstanceState) {',
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
  '    }',
  '}',
  ''
].join('\n'));

console.log(`✅ Android project patched for ${target} (${pkg} v${versionName} code ${versionCode})`);
