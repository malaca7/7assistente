import fs from 'fs';
import path from 'path';

export async function uploadAndRestartDiscloud(token, appId = '7assistente') {
  if (!token) {
    console.log('ℹ️ [Discloud] DISCLOUD_TOKEN não informado. Pacote 7assistente.zip gerado localmente para upload manual.');
    return { success: false, reason: 'no_token' };
  }

  const zipPath = path.resolve('7assistente.zip');
  if (!fs.existsSync(zipPath)) {
    console.error('❌ [Discloud] Arquivo 7assistente.zip não encontrado.');
    return { success: false, reason: 'no_zip' };
  }

  console.log(`🚀 [Discloud] Enviando 7assistente.zip para o app "${appId}"...`);
  try {
    const fileBuffer = fs.readFileSync(zipPath);
    const blob = new Blob([fileBuffer], { type: 'application/zip' });
    const formData = new FormData();
    formData.append('file', blob, '7assistente.zip');

    // 1. Commit/Upload
    const commitRes = await fetch(`https://api.discloud.app/v2/app/${appId}/commit`, {
      method: 'PUT',
      headers: {
        'api-token': token,
      },
      body: formData,
    });

    const commitData = await commitRes.json().catch(() => ({}));
    console.log('📦 [Discloud] Resposta do Commit:', commitData);

    // 2. Restart
    console.log(`🔄 [Discloud] Reiniciando aplicação "${appId}"...`);
    const restartRes = await fetch(`https://api.discloud.app/v2/app/${appId}/restart`, {
      method: 'PUT',
      headers: {
        'api-token': token,
      },
    });

    const restartData = await restartRes.json().catch(() => ({}));
    console.log('✅ [Discloud] Resposta do Reinício:', restartData);

    return { success: true, commit: commitData, restart: restartData };
  } catch (err) {
    console.error('❌ [Discloud] Erro na comunicação com API Discloud:', err.message);
    return { success: false, error: err.message };
  }
}
