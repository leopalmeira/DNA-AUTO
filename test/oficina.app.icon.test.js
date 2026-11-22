'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const manifest=JSON.parse(read('oficina.app/manifest.json'));
assert.equal(manifest.id,'/oficina/');
assert.equal(manifest.start_url,'/oficina/');
assert.ok(manifest.icons.every(i=>i.src.startsWith('/oficina.app/img/icons/')));
assert.ok(read('oficina.app/index.html').includes('/oficina.app/manifest.json'));
assert.equal(read('oficina.app/index.html'),read('public/oficina.html'));
assert.ok(read('scripts/patch-android.js').includes("isOficina ? 'oficina.app' : 'cliente.app'"));
assert.ok(read('oficina.app/js/components/pwaInstall.js').includes("scope: '/oficina/'"));
const png=path.join(__dirname,'..','oficina.app/img/icons/icon-512x512.png');
if(fs.existsSync(png)&&fs.readFileSync(png).subarray(0,8).toString('hex')==='89504e470d0a1a0a'){
  assert.equal(fs.readFileSync(png).readUInt32BE(16),512);
}
console.log('DNA Oficina: PWA e APK com identidade visual independente.');
