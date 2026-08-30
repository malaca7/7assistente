# Fluxo Obrigatório de Conclusão de Tarefas (Build, GitHub & Discloud)

Sempre que concluir qualquer modificação, adição de funcionalidade ou correção solicitada pelo usuário, execute OBRIGATORIAMENTE e AUTOMATICAMENTE as seguintes etapas antes de finalizar a resposta:

1. **Build do Projeto:**
   - Executar `npm run build` para garantir zero erros de TypeScript e bundling no Vite.

2. **Deploy e Sincronização no GitHub:**
   - Adicionar arquivos alterados e realizar commit descritivo: `git add .` e `git commit -m "..."`.
   - Fazer push para o repositório remoto: `git push origin main`.

3. **Atualização dos Arquivos do Bot no Discloud:**
   - Gerar o pacote otimizado `7assistente.zip` na raiz do projeto contendo `discloud.config`, `index.mjs`, `package.json`, `package-lock.json`, `server` e `dist`.
