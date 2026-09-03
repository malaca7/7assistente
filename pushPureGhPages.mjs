import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const distPath = path.resolve('dist');
if (fs.existsSync(path.join(distPath, '.git'))) {
  fs.rmSync(path.join(distPath, '.git'), { recursive: true, force: true });
}

execSync('git init', { cwd: distPath });
execSync('git config user.name "Malaca Bot"', { cwd: distPath });
execSync('git config user.email "bot@malaca.com.br"', { cwd: distPath });
execSync('git add -A', { cwd: distPath });
execSync('git commit -m "deploy: live production build for talvane.malaca.com.br"', { cwd: distPath });
execSync('git branch -M gh-pages', { cwd: distPath });
execSync('git remote add origin https://github.com/malaca7/7assistente.git', { cwd: distPath });
execSync('git push origin gh-pages --force', { cwd: distPath });
fs.rmSync(path.join(distPath, '.git'), { recursive: true, force: true });

console.log('✅ Fresh dist pushed to gh-pages!');
