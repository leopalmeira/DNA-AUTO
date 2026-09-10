const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Função pura em Node.js para codificar um array de pixels RGBA em um buffer PNG válido
function createPNG(width, height, getPixelRGBA) {
    const rawData = Buffer.alloc(height * (1 + width * 4));
    let offset = 0;

    for (let y = 0; y < height; y++) {
        rawData[offset++] = 0; // Filter byte: None (0)
        for (let x = 0; x < width; x++) {
            const [r, g, b, a] = getPixelRGBA(x, y, width, height);
            rawData[offset++] = r;
            rawData[offset++] = g;
            rawData[offset++] = b;
            rawData[offset++] = a;
        }
    }

    const compressed = zlib.deflateSync(rawData);

    // CRC32 calculation
    const crcTable = [];
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            if (c & 1) c = 0xedb88320 ^ (c >>> 1);
            else c = c >>> 1;
        }
        crcTable[n] = c >>> 0;
    }

    function crc32(buf) {
        let c = 0xffffffff;
        for (let i = 0; i < buf.length; i++) {
            c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
        }
        return (c ^ 0xffffffff) >>> 0;
    }

    function makeChunk(typeStr, dataBuf) {
        const typeBuf = Buffer.from(typeStr, 'ascii');
        const lengthBuf = Buffer.alloc(4);
        lengthBuf.writeUInt32BE(dataBuf.length, 0);

        const toCrc = Buffer.concat([typeBuf, dataBuf]);
        const crcVal = crc32(toCrc);
        const crcBuf = Buffer.alloc(4);
        crcBuf.writeUInt32BE(crcVal, 0);

        return Buffer.concat([lengthBuf, typeBuf, dataBuf, crcBuf]);
    }

    // PNG Header
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = 8; // bit depth
    ihdrData[9] = 6; // color type: 6 (RGBA)
    ihdrData[10] = 0; // compression method
    ihdrData[11] = 0; // filter method
    ihdrData[12] = 0; // interlace method
    const ihdrChunk = makeChunk('IHDR', ihdrData);

    // IDAT
    const idatChunk = makeChunk('IDAT', compressed);

    // IEND
    const iendChunk = makeChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Renderizador dos pixels do DNA AUTO
function getDnaIconPixel(x, y, w, h, isMaskable = false) {
    const nx = (x / w) * 2 - 1;
    const ny = (y / h) * 2 - 1;

    // Background: Dark Obsidian #0B0F19 com gradiente suave para #111827
    const bgR = Math.round(11 + 6 * (ny + 1) * 0.5);
    const bgG = Math.round(15 + 9 * (ny + 1) * 0.5);
    const bgB = Math.round(25 + 14 * (ny + 1) * 0.5);

    if (!isMaskable) {
        // Squircle corner radius (superellipse: (x/r)^n + (y/r)^n <= 1)
        const cornerN = 4.5;
        const cornerDist = Math.pow(Math.abs(nx), cornerN) + Math.pow(Math.abs(ny), cornerN);
        if (cornerDist > 0.96) {
            return [0, 0, 0, 0]; // Transparente fora do squircle
        }
    }

    // Símbolo de DNA Dourado & Anéis
    const cx = -0.02;
    const cy = 0.04;
    const dx = nx - cx;
    const dy = ny - cy;
    const r = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    const inAngleRange = (angle > -2.4 && angle < 1.1);

    let isRibbon = false;
    let ribbonColor = [255, 210, 28, 255]; // Gold #FFD21C

    if (inAngleRange && Math.abs(r - 0.18) < 0.045) {
        isRibbon = true;
        ribbonColor = [255, 210, 28, 255];
    } else if (inAngleRange && Math.abs(r - 0.31) < 0.045) {
        isRibbon = true;
        ribbonColor = [255, 210, 28, 255];
    } else if (inAngleRange && Math.abs(r - 0.44) < 0.045) {
        isRibbon = true;
        ribbonColor = [255, 220, 60, 255];
    } else if (inAngleRange && Math.abs(r - 0.57) < 0.045) {
        isRibbon = true;
        ribbonColor = [255, 210, 28, 255];
    } else if (ny > 0.48 && ny < 0.58 && Math.abs(nx) < 0.65) {
        isRibbon = true;
        ribbonColor = [56, 189, 248, 255]; // Cyan tech #38BDF8
    }

    if (isRibbon) {
        return ribbonColor;
    }

    // Glow suave ao redor do DNA
    const minArcDist = Math.min(
        Math.abs(r - 0.18),
        Math.abs(r - 0.31),
        Math.abs(r - 0.44),
        Math.abs(r - 0.57)
    );
    if (inAngleRange && minArcDist < 0.12) {
        const glowFactor = (1 - minArcDist / 0.12) * 0.3;
        return [
            Math.min(255, Math.round(bgR + 255 * glowFactor * 0.8)),
            Math.min(255, Math.round(bgG + 210 * glowFactor * 0.8)),
            Math.min(255, Math.round(bgB + 28 * glowFactor * 0.8)),
            255
        ];
    }

    return [bgR, bgG, bgB, 255];
}

const iconsDir = path.join(__dirname, '..', '..', '..', 'public', 'img', 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. SVG
const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="50%" stop-color="#0B0F19" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF085" />
      <stop offset="40%" stop-color="#FFD21C" />
      <stop offset="100%" stop-color="#D97706" />
    </linearGradient>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284C7" />
      <stop offset="50%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <rect width="508" height="508" x="2" y="2" rx="110" fill="none" stroke="#1E293B" stroke-width="3" />

  <g transform="translate(256, 230) scale(3.4) translate(-60, -56)" filter="url(#glow)">
    <path d="M 54 62 C 51 55 51 46 57 41 C 62 36 67 40 65 50 C 63 56 64 64 64 64" fill="none" stroke="url(#goldGrad)" stroke-width="7" stroke-linecap="round" />
    <path d="M 45 66 C 41 53 41 39 50 30 C 58 21 68 21 75 30 C 82 40 82 55 77 66" fill="none" stroke="url(#goldGrad)" stroke-width="8" stroke-linecap="round" />
    <path d="M 36 68 C 30 52 31 32 43 20 C 54 9 72 9 83 20 C 93 32 94 52 88 68" fill="none" stroke="url(#goldGrad)" stroke-width="8" stroke-linecap="round" />
    <path d="M 28 70 C 21 52 23 27 36 14 C 50 1 78 1 91 14 C 103 27 105 52 98 70" fill="none" stroke="url(#goldGrad)" stroke-width="8.5" stroke-linecap="round" />
    <path d="M 22 84 L 32 84 C 36 78 42 75 48 75 L 72 75 C 78 75 84 78 88 84 L 98 84" fill="none" stroke="url(#cyanGrad)" stroke-width="9.5" stroke-linecap="round" />
  </g>

  <text x="256" y="445" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="900" letter-spacing="3" text-anchor="middle" fill="#FFFFFF">
    DNA <tspan fill="#FFD21C">AUTO</tspan>
  </text>
  <text x="256" y="475" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" letter-spacing="4" text-anchor="middle" fill="#38BDF8">
    OFICIAL
  </text>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'dna-logo.svg'), svgContent, 'utf8');
console.log('✅ Criado dna-logo.svg');

// 2. PNGs
const png192 = createPNG(192, 192, (x, y, w, h) => getDnaIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), png192);
console.log('✅ Criado icon-192x192.png');

const png512 = createPNG(512, 512, (x, y, w, h) => getDnaIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), png512);
console.log('✅ Criado icon-512x512.png');

const pngMaskable = createPNG(512, 512, (x, y, w, h) => getDnaIconPixel(x, y, w, h, true));
fs.writeFileSync(path.join(iconsDir, 'maskable-icon-512x512.png'), pngMaskable);
console.log('✅ Criado maskable-icon-512x512.png');

const pngApple = createPNG(180, 180, (x, y, w, h) => getDnaIconPixel(x, y, w, h, true));
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), pngApple);
console.log('✅ Criado apple-touch-icon.png');

const pngFavicon = createPNG(48, 48, (x, y, w, h) => getDnaIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'favicon.png'), pngFavicon);
console.log('✅ Criado favicon.png');

console.log('🎉 Todos os ícones do PWA foram gerados com sucesso!');
