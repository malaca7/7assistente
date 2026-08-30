import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('=== [1/5] Compilando Frontend na Branch Source ===');
execSync('git checkout -f source', { stdio: 'inherit' });
execSync('npx vite build', { stdio: 'inherit' });

// Setup SPA files
const distPath = path.resolve('dist');
fs.copyFileSync(path.join(distPath, 'index.html'), path.join(distPath, '404.html'));
fs.writeFileSync(path.join(distPath, '.nojekyll'), '');
fs.writeFileSync(path.join(distPath, 'CNAME'), 'talvane.malaca.com.br\n');

console.log('=== [2/5] Publicando na Branch gh-pages ===');
if (fs.existsSync(path.join(distPath, '.git'))) {
  fs.rmSync(path.join(distPath, '.git'), { recursive: true, force: true });
}
execSync('git init', { cwd: distPath });
execSync('git add -A', { cwd: distPath });
execSync('git commit -m "deploy: full live deploy for talvane.malaca.com.br"', { cwd: distPath });
execSync('git branch -M gh-pages', { cwd: distPath });
execSync('git remote add origin https://github.com/malaca7/7assistente.git', { cwd: distPath });
execSync('git push origin gh-pages --force', { cwd: distPath });
fs.rmSync(path.join(distPath, '.git'), { recursive: true, force: true });

console.log('=== [3/5] Salvando Branch Source ===');
execSync('git add -A', { stdio: 'inherit' });
try {
  execSync('git commit -m "chore: save source before main deployment"', { stdio: 'inherit' });
} catch (e) {}
execSync('git push origin source', { stdio: 'inherit' });

console.log('=== [4/5] Atualizando e Publicando Branch Main ===');
const stageDir = path.resolve('_temp_main_stage');
if (fs.existsSync(stageDir)) fs.rmSync(stageDir, { recursive: true, force: true });
fs.mkdirSync(stageDir, { recursive: true });

fs.cpSync('discloud.config', path.join(stageDir, 'discloud.config'));
fs.cpSync('index.mjs', path.join(stageDir, 'index.mjs'));
fs.cpSync('server', path.join(stageDir, 'server'), { recursive: true });
fs.cpSync('dist', path.join(stageDir, 'dist'), { recursive: true });

// Production package.json
const prodPkg = {
  name: '7assistente',
  version: '1.0.0',
  type: 'module',
  main: 'index.mjs',
  scripts: {
    start: 'node index.mjs'
  },
  dependencies: {
    '@supabase/supabase-js': '^2.112.4',
    '@whiskeysockets/baileys': '^7.0.0-rc14',
    cors: '^2.8.5',
    express: '^4.21.2',
    pino: '^9.6.0',
    qrcode: '^1.5.4'
  }
};
fs.writeFileSync(path.join(stageDir, 'package.json'), JSON.stringify(prodPkg, null, 2) + '\n');

// Switch to main branch
execSync('git checkout -f main', { stdio: 'inherit' });

// Overwrite files on main with exact allowed files
fs.cpSync(path.join(stageDir, 'discloud.config'), 'discloud.config');
fs.cpSync(path.join(stageDir, 'index.mjs'), 'index.mjs');
fs.cpSync(path.join(stageDir, 'package.json'), 'package.json');
fs.rmSync('dist', { recursive: true, force: true });
fs.cpSync(path.join(stageDir, 'dist'), 'dist', { recursive: true });
fs.rmSync('server', { recursive: true, force: true });
fs.cpSync(path.join(stageDir, 'server'), 'server', { recursive: true });

execSync('git add -A dist/ server/ discloud.config index.html index.mjs package.json', { stdio: 'inherit' });
try {
  execSync('git commit -m "deploy: full production runtime update on main"', { stdio: 'inherit' });
} catch (e) {}
execSync('git push origin main', { stdio: 'inherit' });

console.log('=== [5/5] Gerando Pacote 7assistente.zip para Discloud ===');
if (fs.existsSync('7assistente.zip')) fs.rmSync('7assistente.zip', { force: true });
execSync(`powershell -Command "Compress-Archive -Path '${stageDir}/*' -DestinationPath '7assistente.zip' -Force"`, { stdio: 'inherit' });
fs.rmSync(stageDir, { recursive: true, force: true });

// Return to source branch
execSync('git checkout -f source', { stdio: 'inherit' });

console.log('🎉 DEPLOY COMPLETO CONCLUÍDO COM SUCESSO!');
