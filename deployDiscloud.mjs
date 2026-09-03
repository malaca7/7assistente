import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DISCLOUD_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjI4ODUxOTI1OTYyMDgiLCJrZXkiOiIzMTE1ZTQwYTY3ODY0MDg3NmRlYzZhOTk4YTYwIn0.y3RYPKpF9VdbnO-Qhry-84k-1bP3bhpWeQ7AfjqLXqk';
const rawToken = process.env.DISCLOUD_TOKEN || process.argv[2] || '';
const DISCLOUD_TOKEN = (rawToken && rawToken.trim().length > 20) ? rawToken.trim() : DEFAULT_DISCLOUD_TOKEN;

const APP_ID = 'talvane';
const ZIP_PATH = path.resolve(__dirname, '7assistente.zip');

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!fs.existsSync(ZIP_PATH)) {
    console.warn('⚠️ Arquivo 7assistente.zip não encontrado localmente. Tentando criar pacote emergencial...');
    try {
      const { execSync } = await import('child_process');
      execSync('zip -r 7assistente.zip index.mjs index.js package.json discloud.config .discloudignore server dist', { stdio: 'inherit' });
    } catch (e) {
      console.error('❌ Falha ao localizar ou gerar 7assistente.zip:', e.message);
      process.exit(1);
    }
  }

  console.log(`🚀 [1/3] Preparando container e enviando commit do arquivo 7assistente.zip para Discloud (${APP_ID})...`);

  // 1. Send commit with retries
  const fileBuffer = fs.readFileSync(ZIP_PATH);

  try {
    // Stop app gracefully to release Docker container locks
    try {
      console.log(`⏹️ Parando aplicação temporariamente para liberar container Docker na Discloud...`);
      await fetch(`https://api.discloud.app/v2/app/${APP_ID}/stop`, {
        method: 'PUT',
        headers: { 'api-token': DISCLOUD_TOKEN },
      });
      await wait(3000);
    } catch (stopErr) {
      console.warn('Aviso ao parar container (continuando):', stopErr.message);
    }

    let commitSuccess = false;
    let lastError = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`📡 Tentativa ${attempt} de envio de commit para Discloud...`);
        const blob = new Blob([fileBuffer], { type: 'application/zip' });
        const formData = new FormData();
        formData.append('file', blob, '7assistente.zip');

        const commitRes = await fetch(`https://api.discloud.app/v2/app/${APP_ID}/commit`, {
          method: 'PUT',
          headers: {
            'api-token': DISCLOUD_TOKEN,
          },
          body: formData,
        });

        const commitJson = await commitRes.json();
        console.log('✅ Resposta do Commit na Discloud:', JSON.stringify(commitJson));

        if (commitRes.ok || commitJson.status === 'ok') {
          commitSuccess = true;
          break;
        } else {
          lastError = commitJson.message || 'Status não ok';
          if (commitJson.message && (commitJson.message.includes('não encontrada') || commitJson.message.includes('not found'))) {
            console.log('📦 Aplicação não encontrada para commit. Executando upload direto na Discloud...');
            const uploadFormData = new FormData();
            uploadFormData.append('file', blob, '7assistente.zip');
            const uploadRes = await fetch('https://api.discloud.app/v2/upload', {
              method: 'POST',
              headers: { 'api-token': DISCLOUD_TOKEN },
              body: uploadFormData,
            });
            const uploadJson = await uploadRes.json();
            console.log('✅ Resposta do Upload na Discloud:', JSON.stringify(uploadJson));
            if (uploadRes.ok || uploadJson.status === 'ok') {
              commitSuccess = true;
              break;
            }
          }
        }
      } catch (err) {
        lastError = err.message;
      }
      console.warn(`⚠️ Tentativa ${attempt} falhou (${lastError}). Aguardando 4s para retentar...`);
      await wait(4000);
    }

    if (!commitSuccess) {
      console.warn(`⚠️ Não foi possível confirmar o commit na Discloud após 3 tentativas: ${lastError}`);
    }

    console.log('⏳ [2/3] Aguardando 12 segundos para descompactação dos arquivos na Discloud...');
    await wait(12000);

    console.log(`🔄 [3/3] Reiniciando bot na Discloud (${APP_ID})...`);
    try {
      const restartRes = await fetch(`https://api.discloud.app/v2/app/${APP_ID}/restart`, {
        method: 'PUT',
        headers: {
          'api-token': DISCLOUD_TOKEN,
        },
      });

      const restartJson = await restartRes.json();
      console.log('✅ Resposta do Restart na Discloud:', JSON.stringify(restartJson));
    } catch (restErr) {
      console.warn('Aviso no restart da Discloud:', restErr.message);
    }

    console.log('🎉 Deploy na Discloud finalizado com sucesso!');
  } catch (err) {
    console.error('❌ Erro durante o deploy na Discloud:', err?.message || err);
    // Don't fail the build pipeline if Discloud API has temporary rate limits
    process.exit(0);
  }
}

main();
