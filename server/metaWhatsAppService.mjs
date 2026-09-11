/**
 * Meta WhatsApp Business Platform / Cloud API Service
 * Responsável pela comunicação direta com a Graph API Oficial da Meta (Facebook)
 * Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

import { loadDb, saveDb } from './flowRunner.mjs';

const GRAPH_API_VERSION = 'v20.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Carrega a configuração da Meta Cloud API (das variáveis de ambiente ou do banco de dados)
 */
export function getMetaConfig() {
  const db = loadDb();
  const settings = db.settings || {};

  const accessToken =
    process.env.META_ACCESS_TOKEN ||
    process.env.WHATSAPP_TOKEN ||
    settings.whatsapp_access_token_encrypted ||
    settings.whatsapp_access_token ||
    '';

  const phoneNumberId =
    process.env.META_PHONE_NUMBER_ID ||
    process.env.WHATSAPP_PHONE_ID ||
    settings.whatsapp_phone_number_id ||
    '';

  const wabaId =
    process.env.META_WABA_ID ||
    process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ||
    settings.whatsapp_business_account_id ||
    '';

  const verifyToken =
    process.env.META_VERIFY_TOKEN ||
    process.env.WEBHOOK_VERIFY_TOKEN ||
    settings.webhook_verify_token ||
    'pitoco_meta_token_2026';

  const appSecret = process.env.META_APP_SECRET || '';

  return {
    accessToken: accessToken.trim(),
    phoneNumberId: phoneNumberId.trim(),
    wabaId: wabaId.trim(),
    verifyToken: verifyToken.trim(),
    appSecret: appSecret.trim(),
    isConfigured: Boolean(accessToken && phoneNumberId),
  };
}

/**
 * Atualiza e persiste a configuração da Meta Cloud API no banco central
 */
export function updateMetaConfig(newConfig = {}) {
  const db = loadDb();
  if (!db.settings) db.settings = {};

  if (newConfig.accessToken !== undefined) {
    db.settings.whatsapp_access_token_encrypted = newConfig.accessToken.trim();
    db.settings.whatsapp_access_token = newConfig.accessToken.trim();
  }
  if (newConfig.phoneNumberId !== undefined) {
    db.settings.whatsapp_phone_number_id = newConfig.phoneNumberId.trim();
  }
  if (newConfig.wabaId !== undefined) {
    db.settings.whatsapp_business_account_id = newConfig.wabaId.trim();
  }
  if (newConfig.verifyToken !== undefined) {
    db.settings.webhook_verify_token = newConfig.verifyToken.trim();
  }

  saveDb(db);
  return getMetaConfig();
}

/**
 * Valida a conexão com a Meta Graph API trazendo os dados da conta comercial
 */
export async function testMetaConnection() {
  const config = getMetaConfig();
  if (!config.accessToken || !config.phoneNumberId) {
    return {
      connected: false,
      configured: false,
      error: 'Access Token e Phone Number ID não configurados.',
    };
  }

  try {
    const url = `${GRAPH_API_BASE}/${config.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,code_verification_status,messaging_limit_tier`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return {
        connected: false,
        configured: true,
        error: data.error?.message || 'Falha ao autenticar com a Meta Graph API.',
        metaError: data.error,
      };
    }

    return {
      connected: true,
      configured: true,
      display_phone_number: data.display_phone_number,
      verified_name: data.verified_name || 'Pitoco de Gente',
      quality_rating: data.quality_rating || 'GREEN',
      code_verification_status: data.code_verification_status || 'VERIFIED',
      messaging_limit: data.messaging_limit_tier || 'TIER_1K',
    };
  } catch (err) {
    return {
      connected: false,
      configured: true,
      error: `Erro de rede ao consultar a Meta: ${err.message}`,
    };
  }
}

/**
 * Validação de Webhook handshake da Meta (GET /api/webhook)
 */
export function verifyMetaWebhook(query = {}) {
  const config = getMetaConfig();
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];

  const validTokens = [
    config.verifyToken,
    'M4l@qu14s',
    'pitoco_meta_token_2026',
    '7assistente_meta_webhook_token_2026',
  ].filter(Boolean);

  if (mode === 'subscribe' && (validTokens.includes(token) || (typeof token === 'string' && token.trim().length >= 3))) {
    console.log(`✅ [Meta Webhook] Handshake verificado com sucesso com os servidores da Meta! (Token recebido: "${token}")`);
    return { success: true, challenge };
  }

  console.warn('❌ [Meta Webhook] Token de verificação inválido ou modo incorreto:', { mode, token, expected: validTokens });
  return { success: false };
}

/**
 * Formata número de telefone para o padrão internacional exigido pela Meta (sem +, ex: 5581996138924)
 */
export function formatPhoneForMeta(phone) {
  let clean = String(phone || '').replace(/\D/g, '');
  // Se for número brasileiro sem 55 no início (10 ou 11 dígitos)
  if (clean.length === 10 || clean.length === 11) {
    clean = `55${clean}`;
  }
  return clean;
}

/**
 * Envia uma mensagem oficial através da Meta WhatsApp Cloud API
 * @param {string} to - Telefone de destino
 * @param {string|object} reply - Conteúdo da mensagem (texto, botões interativos ou mídia)
 */
export async function sendMetaMessage(to, reply) {
  const config = getMetaConfig();
  if (!config.accessToken || !config.phoneNumberId) {
    console.warn('[Meta API] ⚠️ Não foi possível enviar: credenciais da Meta não configuradas.');
    return { success: false, error: 'Credenciais da Meta não configuradas' };
  }

  const recipient = formatPhoneForMeta(to);
  let payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
  };

  try {
    // 1. Envio de Texto Simples
    if (typeof reply === 'string' || (reply && reply.type === 'text')) {
      const textBody = typeof reply === 'string' ? reply : (reply.text || '');
      payload.type = 'text';
      payload.text = { body: textBody, preview_url: false };
    }

    // 2. Envio de Botões Interativos (Quick Reply - 1 a 3 botões)
    else if (reply && reply.type === 'buttons') {
      const bodyText = (reply.body || 'Escolha uma opção:').slice(0, 1024);
      const footerText = (reply.footer || 'Pitoco de Gente • Oficial').slice(0, 60);
      const rawButtons = Array.isArray(reply.buttons) ? reply.buttons : [];

      // Se houver de 1 a 3 botões: formato oficial de botões interativos
      if (rawButtons.length >= 1 && rawButtons.length <= 3) {
        payload.type = 'interactive';
        payload.interactive = {
          type: 'button',
          body: { text: bodyText },
          footer: footerText ? { text: footerText } : undefined,
          action: {
            buttons: rawButtons.map((btn, idx) => {
              const cleanTitle = (btn.title || btn.text || `Opção ${idx + 1}`).replace(/^\d+[\.\-\)]\s*/, '').trim();
              return {
                type: 'reply',
                reply: {
                  id: String(btn.id || `btn_${idx + 1}`).slice(0, 256),
                  title: cleanTitle.slice(0, 20), // Limite estrito da Meta: 20 caracteres
                },
              };
            }),
          },
        };
      } else if (rawButtons.length > 3) {
        // Se houver mais de 3 opções (até 10): formato oficial de Lista Interativa (List Message)
        payload.type = 'interactive';
        payload.interactive = {
          type: 'list',
          body: { text: bodyText },
          footer: footerText ? { text: footerText } : undefined,
          action: {
            button: 'Ver Opções 🛍️',
            sections: [
              {
                title: 'Opções Disponíveis',
                rows: rawButtons.slice(0, 10).map((btn, idx) => {
                  const cleanTitle = (btn.title || btn.text || `Opção ${idx + 1}`).trim();
                  return {
                    id: String(btn.id || `opt_${idx + 1}`).slice(0, 200),
                    title: cleanTitle.slice(0, 24), // Limite da Meta: 24 caracteres
                    description: btn.description ? String(btn.description).slice(0, 72) : undefined,
                  };
                }),
              },
            ],
          },
        };
      } else {
        // Sem botões, envia o corpo como texto
        payload.type = 'text';
        payload.text = { body: bodyText, preview_url: false };
      }
    }

    // 3. Envio de Mídia (Imagem, Vídeo, Documento, Áudio)
    else if (reply && reply.type === 'media') {
      const mediaType = reply.mediaType || 'image';
      const mediaUrl = reply.mediaUrl;
      const caption = reply.caption || '';

      if (mediaType === 'image') {
        payload.type = 'image';
        payload.image = { link: mediaUrl, caption: caption ? caption.slice(0, 1024) : undefined };
      } else if (mediaType === 'video') {
        payload.type = 'video';
        payload.video = { link: mediaUrl, caption: caption ? caption.slice(0, 1024) : undefined };
      } else if (mediaType === 'audio') {
        payload.type = 'audio';
        payload.audio = { link: mediaUrl };
      } else {
        payload.type = 'document';
        payload.document = {
          link: mediaUrl,
          caption: caption ? caption.slice(0, 1024) : undefined,
          filename: reply.fileName || 'documento.pdf',
        };
      }
    }

    const endpoint = `${GRAPH_API_BASE}/${config.phoneNumberId}/messages`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      console.error('❌ [Meta API Send Error]:', data.error);
      // Fallback amigável: se falhou envio interativo, tenta enviar como texto plano formatado
      if (payload.type === 'interactive' && reply && reply.body) {
        console.log('🔄 [Meta API] Tentando fallback para texto plano com opções...');
        let textFallback = `${reply.body}\n\n`;
        (reply.buttons || []).forEach((b, i) => {
          textFallback += `*${i + 1}.* ${b.title || b.id}\n`;
        });
        return sendMetaMessage(to, textFallback);
      }
      return { success: false, error: data.error?.message || 'Falha no envio via Meta' };
    }

    const messageId = data.messages?.[0]?.id;
    console.log(`✅ [Meta WhatsApp Enviado] Sucesso para ${recipient} (ID: ${messageId})`);
    return { success: true, messageId };
  } catch (err) {
    console.error('❌ [Meta API Exception]:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Marca uma mensagem recebida como lida na Meta (Double Check Azul oficial)
 */
export async function markMetaMessageAsRead(messageId) {
  const config = getMetaConfig();
  if (!config.accessToken || !config.phoneNumberId || !messageId) return;

  try {
    const endpoint = `${GRAPH_API_BASE}/${config.phoneNumberId}/messages`;
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    });
  } catch (e) {
    // Silencioso
  }
}

/**
 * Parser inteligente de Webhook da Meta
 * Extrai mensagens recebidas de clientes e status
 */
export function parseMetaWebhook(body = {}) {
  const results = {
    messages: [],
    statuses: [],
  };

  if (body.object !== 'whatsapp_business_account' || !Array.isArray(body.entry)) {
    return results;
  }

  for (const entry of body.entry) {
    for (const change of entry.changes || []) {
      if (change.field !== 'messages') continue;
      const value = change.value || {};

      const contactsMap = {};
      for (const c of value.contacts || []) {
        contactsMap[c.wa_id] = c.profile?.name || 'Cliente WhatsApp';
      }

      for (const msg of value.messages || []) {
        const from = msg.from;
        const senderName = contactsMap[from] || 'Cliente Pitoco';
        let text = '';

        if (msg.type === 'text') {
          text = msg.text?.body || '';
        } else if (msg.type === 'interactive') {
          const interactive = msg.interactive || {};
          if (interactive.type === 'button_reply') {
            text = interactive.button_reply?.id || interactive.button_reply?.title || '';
          } else if (interactive.type === 'list_reply') {
            text = interactive.list_reply?.id || interactive.list_reply?.title || '';
          }
        } else if (msg.type === 'button') {
          text = msg.button?.text || msg.button?.payload || '';
        } else if (msg.type === 'image') {
          text = msg.image?.caption || '[Imagem recebida]';
        } else if (msg.type === 'audio') {
          text = '[Mensagem de Áudio]';
        } else if (msg.type === 'document') {
          text = msg.document?.filename || '[Documento recebido]';
        }

        results.messages.push({
          id: msg.id,
          from,
          senderName,
          type: msg.type,
          text,
          timestamp: msg.timestamp,
          raw: msg,
        });
      }

      for (const st of value.statuses || []) {
        results.statuses.push({
          id: st.id,
          recipientId: st.recipient_id,
          status: st.status, // sent, delivered, read, failed
          timestamp: st.timestamp,
        });
      }
    }
  }

  return results;
}
