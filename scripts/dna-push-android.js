/* Injeta Firebase Messaging no APK cliente sem gravar credenciais no repositório. */
const fs = require('fs');
const path = require('path');
module.exports = function installDnaPush(pkg, androidRoot, serverUrl) {
  const javaDir = path.join(androidRoot,'app','src','main','java',...pkg.split('.'));
  const androidFiles = ['DnaApp.java','DnaPushPlugin.java','DnaFirebaseMessagingService.java'];
  const settings = {
    '__FIREBASE_APP_ID__':process.env.INPUT_FCM_ANDROID_APP_ID || '',
    '__FIREBASE_API_KEY__':process.env.INPUT_FCM_API_KEY || '',
    '__FIREBASE_PROJECT_ID__':process.env.INPUT_FCM_PROJECT_ID || '',
    '__FIREBASE_SENDER_ID__':process.env.INPUT_FCM_SENDER_ID || '',
    '__SERVER_URL__':serverUrl
  };
  androidFiles.forEach(name => {
    let text = fs.readFileSync(path.join(__dirname,'dna-push-native',name+'.txt'),'utf8');
    text = text.replace(/PACKAGE_DNA/g,pkg);
    for (const [marker,value] of Object.entries(settings)) text=text.replaceAll(marker,JSON.stringify(value));
    fs.mkdirSync(javaDir,{recursive:true});
    fs.writeFileSync(path.join(javaDir,name),text);
  });
  const gradlePath=path.join(androidRoot,'app','build.gradle');
  let gradle=fs.readFileSync(gradlePath,'utf8');
  if (!gradle.includes('com.google.firebase:firebase-messaging')) {
    gradle=gradle.replace(/dependencies\s*\{/,"dependencies {\n    implementation 'com.google.firebase:firebase-messaging:23.4.1'");
    fs.writeFileSync(gradlePath,gradle);
  }
  const manifestPath=path.join(androidRoot,'app','src','main','AndroidManifest.xml');
  let xml=fs.readFileSync(manifestPath,'utf8');
  if (!xml.includes('android:name=".DnaApp"')) xml=xml.replace('<application','<application android:name=".DnaApp"');
  if (!xml.includes('android:name=".DnaFirebaseMessagingService"')) xml=xml.replace('</application>',
    '    <service android:name=".DnaFirebaseMessagingService" android:exported="false">\n'+
    '      <intent-filter><action android:name="com.google.firebase.MESSAGING_EVENT" /></intent-filter>\n'+
    '    </service>\n  </application>');
  fs.writeFileSync(manifestPath,xml);
  console.log('DNA AUTO FCM Android preparado. Configuração '+(settings.__FIREBASE_PROJECT_ID__?'presente':'PENDENTE')+'.');
};
