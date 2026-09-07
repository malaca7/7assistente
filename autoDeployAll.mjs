import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('===============================================================');
  console.log('🚀 [AutoDeploy] Deploy Automático Pitoco de Gente');
  console.log('   GitHub: https://github.com/malaca7/botpitoco.git (branch: main)');
  console.log('   Discloud: https://pitoco.discloud.app');
  console.log('===============================================================');

  // 1. Build de Produção
  console.log('\n📦 [1/4] Compilando frontend (npm run build)...');
  try {
    execSync('npm run build', { cwd: __dirname, stdio: 'inherit' });
    console.log('✅ Frontend compilado com sucesso!');
  } catch (err) {
    console.error('❌ Falha na compilação:', err.message);
    process.exit(1);
  }

  // 2. Garantir assets no dist (CNAME, .nojekyll, 404.html)
  const distDir = path.resolve(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'CNAME'), 'pitoco.malaca.com.br\n');
    fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
    if (fs.existsSync(path.join(distDir, 'index.html'))) {
      fs.copyFileSync(path.join(distDir, 'index.html'), path.join(distDir, '404.html'));
    }
    console.log('✅ Assets de produção (CNAME, .nojekyll, 404.html) verificados.');
  }

  // 3. Verificar e commitar alterações pendentes no Git
  console.log('\n📝 [2/4] Verificando alterações locais no Git...');
  try {
    const status = execSync('git status --porcelain', { cwd: __dirname, encoding: 'utf8' }).trim();
    if (status.length > 0) {
      console.log('📌 Mudanças detectadas no repositório. Criando commit automático...');
      execSync('git add -A', { cwd: __dirname, stdio: 'inherit' });
      execSync('git commit -m "feat(deploy): atualizacao automatica Pitoco de Gente (GitHub e Discloud)"', { cwd: __dirname, stdio: 'inherit' });
      console.log('✅ Commit criado com sucesso!');
    } else {
      console.log('ℹ️ Nenhuma alteração pendente no repositório local.');
    }
  } catch (gitErr) {
    console.warn('⚠️ Nota sobre git commit:', gitErr.message);
  }

  // 4. Sincronizar branch main e enviar ao GitHub (botpitoco.git)
  console.log('\n🌐 [3/4] Enviando branch main para GitHub (https://github.com/malaca7/botpitoco.git)...');
  try {
    execSync('git branch -f main HEAD', { cwd: __dirname, stdio: 'inherit' });
    execSync('git push botpitoco main --force', { cwd: __dirname, stdio: 'inherit' });
    console.log('✅ Branch main enviada com sucesso para https://github.com/malaca7/botpitoco.git!');
  } catch (pushErr) {
    console.error('❌ Erro no push para GitHub botpitoco:', pushErr.message);
  }

  // Sincronizar também com origin (backup) se configurado
  try {
    const remotes = execSync('git remote', { cwd: __dirname, encoding: 'utf8' });
    if (remotes.includes('origin')) {
      console.log('📡 Sincronizando também com remote origin...');
      execSync('git push origin HEAD --force', { cwd: __dirname, stdio: 'inherit' });
      console.log('✅ Remote origin sincronizado!');
    }
  } catch (origErr) {
    console.warn('⚠️ Aviso ao sincronizar com origin:', origErr.message);
  }

  // 5. Empacotar, atualizar e reiniciar bot na Discloud
  console.log('\n🤖 [4/4] Atualizando arquivos do bot no Discloud (pitoco.discloud.app)...');
  try {
    execSync('node deployDiscloud.mjs', { cwd: __dirname, stdio: 'inherit' });
    console.log('✅ Bot no Discloud atualizado e reiniciado com sucesso!');
  } catch (err) {
    console.error('❌ Erro no deploy Discloud:', err.message);
  }

  console.log('\n===============================================================');
  console.log('🎉 DEPLOY COMPLETO CONCLUÍDO COM SUCESSO!');
  console.log(' - GitHub Repository: https://github.com/malaca7/botpitoco/tree/main');
  console.log(' - Bot Discloud API:  https://pitoco.discloud.app');
  console.log(' - Health Check:      https://pitoco.discloud.app/health');
  console.log(' - Site Oficial:      https://pitoco.malaca.com.br');
  console.log('===============================================================');
}

main();
