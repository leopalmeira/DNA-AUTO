// Generated only after APKs are signed and their certificates match the previous release.
const fs = require('fs');
const crypto = require('crypto');
function entry(app, version, code, mandatory) {
  const apk_name = `dna-auto-${app}.apk`;
  const bytes = fs.readFileSync(apk_name);
  const version_code = Number(code);
  if (!/^\d+\.\d+\.\d+$/.test(version) || !Number.isSafeInteger(version_code) || version_code < 1) {
    throw new Error('Versão Android inválida: ' + app);
  }
  return {
    apk_name, package_name: `br.com.dnaauto.${app}`, version, version_code,
    mandatory: mandatory === 'true', apk_size: bytes.length,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex')
  };
}
const manifest = {
  schema_version: 1,
  release_tag: 'apk-latest',
  signature_scheme: 'release-keystore',
  source_commit: process.env.GITHUB_SHA,
  apps: {
    cliente: entry('cliente', process.env.CLIENTE_VERSION, process.env.CLIENTE_CODE, process.env.CLIENTE_REQUIRED),
    oficina: entry('oficina', process.env.OFICINA_VERSION, process.env.OFICINA_CODE, process.env.OFICINA_REQUIRED)
  }
};
fs.writeFileSync('dna-auto-release.json', JSON.stringify(manifest, null, 2) + '\n');
console.log('Manifesto de APKs assinados gerado, separado para Cliente e Oficina.');
