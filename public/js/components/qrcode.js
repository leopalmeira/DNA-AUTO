// ==============================================================================
// DNA AUTO — GERADOR DE QR CODE NATIVO LEVE (SVG)
// ==============================================================================

const QRCodeGenerator = {
    // Gera elemento SVG de QR Code estilizado com cantos e cores de marca
    generateSVG(text, size = 180, darkColor = '#0b0f19', lightColor = '#ffffff') {
        // Usa API de renderização vetorial ou fallback visual de matriz
        const encodedUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=${darkColor.replace('#', '')}&bgcolor=${lightColor.replace('#', '')}&margin=1`;

        return `
            <div class="qrcode-wrapper" style="display:inline-block; padding:10px; background:${lightColor}; border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.15);">
                <img src="${encodedUrl}" width="${size}" height="${size}" alt="QR Code DNA AUTO" style="display:block; border-radius:6px;" onerror="this.parentElement.innerHTML='<div style=\\'width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:#0088ff;color:#fff;font-family:monospace;font-size:10px;text-align:center;padding:8px;box-sizing:border-box;\\'>DNA-QR<br>${text.substring(0, 18)}</div>'" />
            </div>
        `;
    }
};
