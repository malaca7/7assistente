# Pitoco de Gente — Microsserviço WhatsApp Baileys na Discloud

Microsserviço Node.js + Express + Baileys responsável pela conexão com WhatsApp, atendimento automatizado com bot e transbordo para consultoras humanas com suporte a multi-lojas.

---

## 📋 Especificações do Container Discloud

- **App ID:** `pitoco`
- **Subdomínio:** `https://pitoco.discloud.app`
- **RAM Alocada:** `512 MB`
- **Tipo:** `site`
- **Ponto de Entrada:** `index.js` (executa `server.js`)
- **Porta:** `8080` (escutando em `0.0.0.0`)

---

## 🔒 Variáveis de Ambiente (.env)

Configure as seguintes variáveis no painel da Discloud (ou crie um arquivo `.env` seguro):

```env
PORT=8080
SUPABASE_URL=https://cbeiguyvoepbcafmxduy.supabase.co
SUPABASE_ANON_KEY=seu_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=seu_supabase_service_role_key
NEXT_PUBLIC_BOT_URL=https://pitoco.discloud.app
```

> ⚠️ **Atenção:** Nunca versione nem comite o arquivo `.env` ou pastas de credenciais do WhatsApp (`whatsapp_auth`).

---

## 🚀 Endpoints da API REST

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/` | Informações da aplicação e status de conexão |
| `GET` | `/health` | Healthcheck para monitoramento de liveness |
| `GET` | `/api/whatsapp/qr` | Retorna status do WhatsApp, QR Code (texto e Base64 DataURL) |
| `POST` | `/api/whatsapp/qr` | Força reinicialização do socket e geração de novo QR Code |
| `POST` | `/api/send-message` | Envia mensagem de texto/mídia para um número de WhatsApp |
| `GET` | `/api/stores` | Lista as lojas ativas da rede (Centro, Ipojuca, E-commerce) |
| `POST` | `/api/whatsapp/disconnect` | Desconecta a sessão do WhatsApp de forma limpa |

---

## 🛍️ Lojas Suportadas

1. **Loja Matriz — Centro** (`matriz`)
2. **Loja Ipojuca - Filial** (`ipojuca`)
3. **Atendimento Geral / E-commerce** (`ecommerce`)

---

## 📦 Como fazer Deploy na Discloud

1. Crie o arquivo ZIP contendo:
   - `discloud.config`
   - `package.json`
   - `index.js`
   - `server.js`
   - `.discloudignore`
2. Envie o commit via API da Discloud ou CLI (`discloud commit`).
3. O bot iniciará automaticamente na porta 8080.
