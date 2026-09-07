# Diretriz Obrigatória de Conclusão de Tarefas (Pitoco de Gente)

## 1. Processamento de Queued Messages
Sempre que concluir completamente as tarefas e modificações de uma solicitação:
- Verifique se há novas **Queued Messages** (mensagens pendentes na fila) enviadas pelo usuário.
- Se houver mensagem pendente na fila, processe-a imediatamente e execute todas as tarefas e modificações necessárias.
- **Caso NÃO haja mais nenhuma Queued Message pendente**, execute AUTOMATICAMENTE e OBRIGATORIAMENTE o deploy completo antes de encerrar o turno:
  1. Deploy para o GitHub no repositório `https://github.com/malaca7/botpitoco.git` na branch `main`.
  2. Atualização automática dos arquivos do bot e reinicialização no Discloud (`pitoco`).

## 2. Fluxo Automatizado de Deploy
Execute o script central de deploy:
```bash
npm run deploy:full
# ou: node autoDeployAll.mjs
```

Esse fluxo realiza com precisão:
1. **Compilação do Frontend:** `npm run build` (garantindo zero erros e assets em `dist/`, incluindo `CNAME`, `.nojekyll`, `404.html`).
2. **Git Commit & Push:**
   - Adiciona e commita todas as alterações pendentes.
   - Sincroniza a branch `main` com o estado mais recente (`git branch -f main HEAD`).
   - Realiza push para `https://github.com/malaca7/botpitoco.git` na branch `main` (`git push botpitoco main --force`).
   - Sincroniza com o remote `origin` para manter backup.
3. **Atualização e Rebuild no Discloud:**
   - Gera o arquivo `pitoco.zip` atualizado contendo o bot Baileys, servidor Express, flows e frontend compilado (`dist/`).
   - Realiza commit na API da Discloud (`PUT https://api.discloud.app/v2/app/pitoco/commit`).
   - Reinicia o container da aplicação na Discloud (`PUT https://api.discloud.app/v2/app/pitoco/restart`).
   - Valida o status e o health check em `https://pitoco.discloud.app/health`.
