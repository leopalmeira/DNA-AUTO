#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const sharp=require(path.join(__dirname,'..','android-oficina','node_modules','sharp'));
const dir=path.join(__dirname,'..','oficina.app','img','icons');
async function main(){
 const src=fs.readFileSync(path.join(dir,'icon-oficina.svg'));
 for (const [name,size] of [
   ['icon-192x192.png',192],['icon-512x512.png',512],
   ['apple-touch-icon.png',180],['favicon.png',64]
 ]){
   await sharp(src,{density:300}).resize(size,size).png().toFile(path.join(dir,name));
 }
 const inset=52;
 const inner=await sharp(src,{density:300}).resize(512-inset*2,512-inset*2).png().toBuffer();
 await sharp({create:{width:512,height:512,channels:4,background:'#06112A'}})
   .composite([{input:inner,top:inset,left:inset}]).png()
   .toFile(path.join(dir,'maskable-icon-512x512.png'));
 console.log('DNA Oficina: cinco icones PNG gerados.');
}
main().catch(err=>{console.error(err);process.exitCode=1;});
