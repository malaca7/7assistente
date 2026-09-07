import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env if not in process.env
function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const rawToken = process.env.DISCLOUD_TOKEN || process.argv[2] || 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjI4ODUxOTI1OTYyMDgiLCJrZXkiOiIzMTE1ZTQwYTY3ODY0MDg3NmRlYzZhOTk4YTYwIn0.y3RYPKpF9VdbnO-Qhry-84k-1bP3bhpWeQ7AfjqLXqk';
const DISCLOUD_TOKEN = rawToken.trim();
const APP_ID = process.env.DISCLOUD_APP_ID || 'pitoco';
const ZIP_PATH = path.resolve(__dirname, 'pitoco.zip');

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!DISCLOUD_TOKEN || DISCLOUD_TOKEN.length < 10) {
    console.error('❌ Token da Discloud não configurado. Defina DISCLOUD_TOKEN no .env.');
    process.exit(1);
  }

  console.log('📦 [1/4] Gerando pacote atualizado pitoco.zip...');
  try {
    execSync('python make_zip.py', { cwd: __dirname, stdio: 'inherit' });
  } catch (err) {
    console.error('❌ Falha ao gerar zip com python:', err.message);
  }

  if (!fs.existsSync(ZIP_PATH)) {
    console.error(`❌ Arquivo ${ZIP_PATH} não encontrado.`);
    process.exit(1);
  }

  console.log(`🚀 [2/4] Enviando commit para o bot no Discloud (App ID: ${APP_ID})...`);
  const fileBuffer = fs.readFileSync(ZIP_PATH);
  const blob = new Blob([fileBuffer], { type: 'application/zip' });
  const formData = new FormData();
  formData.append('file', blob, 'pitoco.zip');

  let commitSuccess = false;
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`📡 Tentativa ${attempt} de commit no Discloud...`);
      const commitRes = await fetch(`https://api.discloud.app/v2/app/${APP_ID}/commit`, {
        method: 'PUT',
        headers: { 'api-token': DISCLOUD_TOKEN },
        body: formData,
      });

      const commitJson = await commitRes.json();
      console.log('✅ Resposta do Commit:', JSON.stringify(commitJson, null, 2));

      if (commitRes.ok || commitJson.status === 'ok') {
        commitSuccess = true;
        break;
      } else {
        lastError = commitJson.message || 'Falha no commit';
      }
    } catch (err) {
      lastError = err.message;
    }
    console.warn(`⚠️ Tentativa ${attempt} falhou (${lastError}). Aguardando 4s...`);
    await wait(4000);
  }

  if (!commitSuccess) {
    console.error('❌ Não foi possível realizar o commit na Discloud:', lastError);
    process.exit(1);
  }

  console.log('⏳ [3/4] Aguardando descompactação e sincronização na Discloud (8s)...');
  await wait(8000);

  console.log(`🔄 [4/4] Reiniciando container do bot Pitoco no Discloud (${APP_ID})...`);
  try {
    const restartRes = await fetch(`https://api.discloud.app/v2/app/${APP_ID}/restart`, {
      method: 'PUT',
      headers: { 'api-token': DISCLOUD_TOKEN },
    });
    const restartJson = await restartRes.json();
    console.log('✅ Resposta do Restart:', JSON.stringify(restartJson, null, 2));
  } catch (err) {
    console.warn('Aviso ao reiniciar:', err.message);
  }

  console.log('⏳ Aguardando reinicialização (5s)...');
  await wait(5000);

  // Status check
  try {
    const statusRes = await fetch(`https://api.discloud.app/v2/app/${APP_ID}/status`, {
      headers: { 'api-token': DISCLOUD_TOKEN },
    });
    const statusJson = await statusRes.json();
    console.log('📊 Status Atual do Container:', JSON.stringify(statusJson?.apps || statusJson, null, 2));
  } catch (e) {}

  console.log(`🎉 Deploy e Rebuild concluídos com sucesso no Discloud! (https://${APP_ID}.discloud.app)`);
}

main();
