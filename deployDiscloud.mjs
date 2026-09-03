import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DISCLOUD_TOKEN = process.env.DISCLOUD_TOKEN || process.argv[2] || '';
const APP_ID = 'talvanebarber';
const ZIP_PATH = path.resolve(__dirname, '7assistente.zip');

async function main() {
  if (!fs.existsSync(ZIP_PATH)) {
    console.error('❌ Arquivo 7assistente.zip não encontrado. Execute packageDiscloud.ps1 primeiro.');
    process.exit(1);
  }

  if (!DISCLOUD_TOKEN) {
    console.log('⚠️ Nenhum token da Discloud fornecido.');
    console.log('ℹ️ Para enviar commit e reiniciar o bot na Discloud automaticamente:');
    console.log('   node deployDiscloud.mjs SEU_TOKEN_DISCLOUD');
    process.exit(0);
  }

  console.log(`🚀 [1/3] Preparando container e enviando commit do arquivo 7assistente.zip para Discloud (${APP_ID})...`);

  // 1. Send commit
  const fileBuffer = fs.readFileSync(ZIP_PATH);
  const blob = new Blob([fileBuffer], { type: 'application/zip' });
  const formData = new FormData();
  formData.append('file', blob, '7assistente.zip');

  try {
    // 0. Stop app gracefully to release Docker container locks
    try {
      console.log(`⏹️ Parando aplicação temporariamente para liberar container Docker na Discloud...`);
      await fetch(`https://api.discloud.app/v2/app/${APP_ID}/stop`, {
        method: 'PUT',
        headers: { 'api-token': DISCLOUD_TOKEN },
      });
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch {}

    const commitRes = await fetch(`https://api.discloud.app/v2/app/${APP_ID}/commit`, {
      method: 'PUT',
      headers: {
        'api-token': DISCLOUD_TOKEN,
      },
      body: formData,
    });

    const commitJson = await commitRes.json();
    console.log('✅ Resposta do Commit na Discloud:', JSON.stringify(commitJson));

    console.log('⏳ [2/3] Aguardando 12 segundos para descompactação dos arquivos...');
    await new Promise((resolve) => setTimeout(resolve, 12000));

    console.log(`🔄 [3/3] Reiniciando bot na Discloud (${APP_ID})...`);
    const restartRes = await fetch(`https://api.discloud.app/v2/app/${APP_ID}/restart`, {
      method: 'PUT',
      headers: {
        'api-token': DISCLOUD_TOKEN,
      },
    });

    const restartJson = await restartRes.json();
    console.log('✅ Resposta do Restart na Discloud:', JSON.stringify(restartJson));
    console.log('🎉 Bot atualizado e reiniciado na Discloud com sucesso!');
  } catch (err) {
    console.error('❌ Erro durante o deploy na Discloud:', err?.message || err);
    process.exit(1);
  }
}

main();
