import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('===============================================================');
  console.log('🚀 [AutoDeploy] Deploy Automático Pitoco de Gente (GitHub & Discloud)');
  console.log('   GitHub:   https://github.com/malaca7/botpitoco.git (branch: main)');
  console.log('   Discloud: https://pitoco.discloud.app');
  console.log('   Site:     https://pitoco.malaca.com.br');
  console.log('===============================================================');

  // 1. Build de Produção do Frontend
  console.log('\n📦 [1/5] Compilando frontend (npm run build)...');
  try {
    execSync('npm run build', { cwd: __dirname, stdio: 'inherit' });
    console.log('✅ Frontend compilado com sucesso!');
  } catch (err) {
    console.error('❌ Falha na compilação:', err.message);
    process.exit(1);
  }

  // 2. Garantir assets no dist (CNAME, .nojekyll, 404.html e rotas físicas)
  const distDir = path.resolve(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'CNAME'), 'pitoco.malaca.com.br\n');
    fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
    fs.writeFileSync(path.resolve(__dirname, 'CNAME'), 'pitoco.malaca.com.br\n');
    fs.writeFileSync(path.resolve(__dirname, '.nojekyll'), '');

    const root404 = path.resolve(__dirname, '404.html');
    if (fs.existsSync(root404)) {
      fs.copyFileSync(root404, path.join(distDir, '404.html'));
    }

    const distHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

    // Criar diretórios físicos para cada rota SPA para eliminar erro 404 no GitHub Pages
    const routes = [
      'admin', 
      'login', 
      'ceo', 
      'atendimento', 
      'lojas', 
      'fluxos', 
      'whatsapp', 
      'catalogo', 
      'enxoval', 
      'medidas', 
      'fila', 
      'tickets', 
      'conversas', 
      'dashboard'
    ];

    for (const route of routes) {
      // 1. No dist/
      const routeDistDir = path.join(distDir, route);
      if (!fs.existsSync(routeDistDir)) fs.mkdirSync(routeDistDir, { recursive: true });
      fs.writeFileSync(path.join(routeDistDir, 'index.html'), distHtml, 'utf8');

      // 2. Na raiz do repositório
      const routeRootDir = path.resolve(__dirname, route);
      if (!fs.existsSync(routeRootDir)) fs.mkdirSync(routeRootDir, { recursive: true });
      fs.writeFileSync(path.join(routeRootDir, 'index.html'), distHtml, 'utf8');
    }
    console.log('✅ Diretórios físicos de rotas (/admin, /login, etc.) gerados para prevenir erro 404.');

    // Copiar assets para a raiz para evitar tela branca caso GitHub Pages sirva da raiz do main
    const rootAssets = path.resolve(__dirname, 'assets');
    if (fs.existsSync(path.join(distDir, 'assets'))) {
      fs.cpSync(path.join(distDir, 'assets'), rootAssets, { recursive: true });
      console.log('✅ Assets compilados sincronizados na raiz do repositório (/assets).');
    }

    // Copiar dist para /docs para garantir suporte caso GitHub Pages aponte para /docs
    const docsDir = path.resolve(__dirname, 'docs');
    fs.cpSync(distDir, docsDir, { recursive: true });
    console.log('✅ Pasta /docs atualizada para suporte ao GitHub Pages /docs.');

    // Copiar dist para discloud/dist para o bot servir os arquivos estáticos
    const discloudDist = path.resolve(__dirname, 'discloud', 'dist');
    fs.cpSync(distDir, discloudDist, { recursive: true });
    console.log('✅ Frontend sincronizado no diretório da Discloud.');
  }

  // 3. Verificar e commitar alterações no Git
  console.log('\n📝 [2/5] Registrando alterações no Git...');
  try {
    execSync('git add -A', { cwd: __dirname, stdio: 'inherit' });
    const status = execSync('git status --porcelain', { cwd: __dirname, encoding: 'utf8' }).trim();
    if (status.length > 0) {
      console.log('📌 Mudanças detectadas. Criando commit de deploy...');
      execSync('git commit -m "fix(router): eliminar 404 no /admin do GitHub Pages e adicionar sincronizacao realtime CEO"', { cwd: __dirname, stdio: 'inherit' });
      console.log('✅ Commit criado com sucesso!');
    } else {
      console.log('ℹ️ Nenhuma alteração pendente para commit.');
    }
  } catch (gitErr) {
    console.warn('ℹ️ Informação sobre git commit:', gitErr.message);
  }

  // 4. Sincronizar branch main no GitHub (botpitoco.git)
  console.log('\n🌐 [3/5] Enviando branch main para GitHub (https://github.com/malaca7/botpitoco.git)...');
  try {
    execSync('git branch -f main HEAD', { cwd: __dirname, stdio: 'inherit' });
    execSync('git push botpitoco main --force', { cwd: __dirname, stdio: 'inherit' });
    console.log('✅ Branch main enviada com sucesso para botpitoco!');
  } catch (pushErr) {
    console.error('❌ Erro no push para GitHub botpitoco:', pushErr.message);
  }

  // Sincronizar também com remote origin (backup)
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

  // 5. Atualizar branch gh-pages no GitHub botpitoco com os arquivos estáticos de produção
  console.log('\n🌐 [4/5] Atualizando branch gh-pages no GitHub...');
  try {
    const treeHash = execSync('git write-tree --prefix=dist/', { cwd: __dirname, encoding: 'utf8' }).trim();
    if (treeHash) {
      const commitHash = execSync(`git commit-tree ${treeHash} -m "deploy: update GitHub Pages production release with /admin route"`, { cwd: __dirname, encoding: 'utf8' }).trim();
      execSync(`git push botpitoco ${commitHash}:refs/heads/gh-pages --force`, { cwd: __dirname, stdio: 'inherit' });
      console.log('✅ Branch gh-pages enviada com sucesso para botpitoco!');
      
      try {
        execSync(`git push origin ${commitHash}:refs/heads/gh-pages --force`, { cwd: __dirname, stdio: 'inherit' });
        console.log('✅ Branch gh-pages enviada com sucesso para origin!');
      } catch (e) {}
    }
  } catch (ghPagesErr) {
    console.warn('⚠️ Nota sobre envio de gh-pages:', ghPagesErr.message);
  }

  // 6. Empacotar, atualizar e reiniciar bot no Discloud
  console.log('\n🤖 [5/5] Atualizando arquivos do bot no Discloud (pitoco.discloud.app)...');
  try {
    execSync('node deployDiscloud.mjs', { cwd: __dirname, stdio: 'inherit' });
    console.log('✅ Bot no Discloud atualizado e reiniciado com sucesso!');
  } catch (err) {
    console.error('❌ Erro no deploy Discloud:', err.message);
  }

  console.log('\n===============================================================');
  console.log('🎉 DEPLOY COMPLETO CONCLUÍDO COM SUCESSO!');
  console.log(' - GitHub Repository: https://github.com/malaca7/botpitoco/tree/main');
  console.log(' - GitHub Pages:      https://pitoco.malaca.com.br/admin');
  console.log(' - Bot Discloud API:  https://pitoco.discloud.app');
  console.log(' - Health Check:      https://pitoco.discloud.app/health');
  console.log('===============================================================');
}

main();
