// Pitoco de Gente — Motor Oficial do Bot de Atendimento & Vendas WhatsApp (Admin Flow)
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PITOCO_MEASURE_GUIDE = [
  { size: 'RN', ageRange: '0 a 1 mês', weightRange: '2,5 a 4 kg', heightRange: 'até 52 cm', description: 'Ideal para os primeiros dias e mala de maternidade' },
  { size: 'P', ageRange: '1 a 3 meses', weightRange: '4 a 6 kg', heightRange: '52 a 62 cm', description: 'Mês a mês inicial com conforto máximo' },
  { size: 'M', ageRange: '3 a 6 meses', weightRange: '6 a 8 kg', heightRange: '62 a 67 cm', description: 'Fase de descobertas e rolinhos' },
  { size: 'G', ageRange: '6 a 9 meses', weightRange: '8 a 9,5 kg', heightRange: '67 a 72 cm', description: 'Início da introdução alimentar' },
  { size: 'GG', ageRange: '9 a 12 meses', weightRange: '9,5 a 11 kg', heightRange: '72 a 77 cm', description: 'Primeiros passinhos com pezinho livre' },
  { size: '1 ano', ageRange: '12 a 18 meses', weightRange: '11 a 12,5 kg', heightRange: '77 a 82 cm', description: 'Roupinhas reforçadas e flexíveis' },
  { size: '2 anos', ageRange: '18 a 24 meses', weightRange: '12,5 a 14 kg', heightRange: '82 a 88 cm', description: 'Fase ativa de brincadeiras' },
  { size: '3 anos', ageRange: '2 a 3 anos', weightRange: '14 a 16 kg', heightRange: '88 a 98 cm', description: 'Total liberdade de movimento' },
];

export const PITOCO_STORES = [
  {
    id: 'store-001',
    name: 'Loja Matriz — Centro',
    slug: 'matriz',
    address: 'Rua do Sol, 120 - Centro, Recife - PE',
    phone: '8132211000',
    whatsapp_number: '81996138924',
    is_active: true,
    business_hours: '08:30 às 18:30',
    city: 'Recife - PE',
  },
  {
    id: 'store-002',
    name: 'Loja Ipojuca - Filial',
    slug: 'ipojuca',
    address: 'Rodovia PE-060, Centro, Ipojuca - PE',
    phone: '8135511000',
    whatsapp_number: '81996138924',
    is_active: true,
    business_hours: '08:30 às 18:00',
    city: 'Ipojuca - PE',
  },
  {
    id: 'store-003',
    name: 'Atendimento Geral / E-commerce',
    slug: 'ecommerce',
    address: 'Central Digital / E-commerce Brasil',
    phone: '81996138924',
    whatsapp_number: '81996138924',
    is_active: true,
    business_hours: '24h Automático | Consultoras: 08h às 20h',
    city: 'Digital / Brasil',
  },
];

export const PITOCO_SAMPLE_PRODUCTS = [
  {
    id: 'prod-001',
    name: 'Body Manga Longa Algodão Suedine 100% Pima',
    description: 'Puro algodão suedine 100% egípcio com toque sedoso e gola envelope antialérgica.',
    price: 49.90,
    promotional_price: 39.90,
    sizes: ['RN', 'P', 'M', 'G', 'GG'],
    colors: ['Branco Puro', 'Azul Bebê', 'Rosa Seco', 'Verde Menta'],
    material: 'Algodão Suedine 100%',
  },
  {
    id: 'prod-002',
    name: 'Macacão Canelado com Zíper Duplo Soft',
    description: 'Zíper com duplo cursor (abre por cima e por baixo), proteção para a pele e pezinho reversível.',
    price: 79.90,
    promotional_price: 69.90,
    sizes: ['RN', 'P', 'M', 'G', '1 ano'],
    colors: ['Azul Bebê', 'Rosa Seco', 'Verde Menta', 'Bege Neutro'],
    material: 'Algodão Canelado Premium',
  },
  {
    id: 'prod-003',
    name: 'Saída de Maternidade Tricot Luxo Realeza 4 Peças',
    description: 'Macacão bordado, manta aconchegante, touquinha e luvinhas em tricot térmico antialérgico.',
    price: 189.90,
    promotional_price: 169.90,
    sizes: ['RN', 'P'],
    colors: ['Branco Puro', 'Rosa Seco', 'Azul Bebê', 'Amarelo Manteiga'],
    material: 'Tricot Luxo Antialérgico',
  },
  {
    id: 'prod-004',
    name: 'Kit Berço Algodão 400 Fios Trança Nuvem',
    description: 'Lateral em trança macia, cabeceira nuvem, lençol 400 fios e fronha antissufocante.',
    price: 289.90,
    promotional_price: 259.90,
    sizes: ['RN', 'P', 'M', 'G'],
    colors: ['Branco Puro', 'Verde Menta', 'Bege Neutro'],
    material: 'Algodão Percal 400 Fios Acetinado',
  },
  {
    id: 'prod-005',
    name: 'Mala Maternidade Térmica Master Impermeável',
    description: 'Espaço térmico com divisórias para as 48h no hospital e bolsos para mamadeiras.',
    price: 219.90,
    promotional_price: 199.90,
    sizes: ['G', 'GG'],
    colors: ['Bege Neutro', 'Rosa Seco', 'Azul Bebê'],
    material: 'Couro Ecológico Impermeável Soft',
  },
];

export function getMainMenuText(userName = '', botConfig = {}) {
  const greeting = userName ? `Olá, *${userName}*!` : 'Olá, mamãe e papai!';
  const customWelcome = botConfig.welcome_message 
    ? botConfig.welcome_message.replace('{clientName}', userName || 'Cliente')
    : `👶✨ *PITOCO DE GENTE — Roupas de Bebê & Enxovais*\n${greeting} Bem-vindo(a) à nossa loja oficial! Como podemos te ajudar hoje?`;

  return (
    `${customWelcome}\n\n` +
    `Digite o número da opção desejada:\n\n` +
    `1️⃣ *Ver Catálogo de Produtos* (Bodies, Macacões, Saídas, Berço)\n` +
    `2️⃣ *Guia de Medidas* (RN ao 3 anos com peso e altura)\n` +
    `3️⃣ *Checklist da Mala de Maternidade*\n` +
    `4️⃣ *Consultoria VIP de Enxoval* (Agendamento personalizado)\n` +
    `5️⃣ *Cálculo de Frete & Formas de Entrega* (Motoboy/Correios/Retirada)\n` +
    `6️⃣ *Pagamento via PIX* (Chave & QR Code Copia e Cola)\n` +
    `7️⃣ *Falar com Atendente Humana* (Escolha sua loja física ou online)\n\n` +
    `_Responda apenas com o número de 1 a 7._`
  );
}

export function getMeasureGuideText() {
  let txt = `📏 *GUIA DE MEDIDAS OFICIAL — PITOCO DE GENTE*\n\n`;
  PITOCO_MEASURE_GUIDE.forEach(item => {
    txt += `▫️ *Tamanho ${item.size}* (${item.ageRange})\n`;
    txt += `   ⚖️ Peso: ${item.weightRange} | 📐 Altura: ${item.heightRange}\n`;
    txt += `   💡 _${item.description}_\n\n`;
  });
  txt += `_Digite *0* para voltar ao Menu Principal._`;
  return txt;
}

export function getLayetteChecklistText() {
  return (
    `🧳 *CHECKLIST MALA DE MATERNIDADE — PITOCO DE GENTE*\n` +
    `Prepare a malinha do seu bebê com calma e carinho por volta da 32ª semana:\n\n` +
    `👶 *Para o Bebê:*\n` +
    `✅ 6 Bodies manga longa em algodão suedine 100%\n` +
    `✅ 6 Macacões com zíper duplo frontal\n` +
    `✅ 6 Calças com pezinho (mijões)\n` +
    `✅ 2 Saídas de Maternidade completas com manta em tricot\n` +
    `✅ 6 Paninhos de boca atoalhados bordados\n` +
    `✅ 3 Fraldas de ombro de algodão\n` +
    `✅ 3 Pares de meias e luvinhas sem costura\n` +
    `✅ 2 Touquinhas de suedine macias\n` +
    `✅ 1 Manta quentinha antialérgica extra\n` +
    `✅ 1 Pacote de fraldas descartáveis tamanho RN\n\n` +
    `🛍️ Todos estes itens estão disponíveis em nosso catálogo com pronta-entrega!\n\n` +
    `_Digite *1* para ver os produtos ou *0* para o Menu Principal._`
  );
}

export function getShippingInfoText(botConfig = {}) {
  const motoboy = Number(botConfig.shipping_motoboy_price || 15.00).toFixed(2).replace('.', ',');
  const correios = Number(botConfig.shipping_correios_price || 24.90).toFixed(2).replace('.', ',');
  const freeMin = Number(botConfig.free_shipping_threshold || 250.00).toFixed(2).replace('.', ',');

  return (
    `🚚 *FORMAS DE ENTREGA & FRETE — PITOCO DE GENTE*\n\n` +
    `1️⃣ *Motoboy Express (Recife e RMR)*:\n` +
    `   - Entrega no mesmo dia para pedidos até 14h.\n` +
    `   - Valor fixo: *R$ ${motoboy}* (Grátis em compras acima de R$ ${freeMin})\n\n` +
    `2️⃣ *Correios (Todo o Brasil via SEDEX ou PAC)*:\n` +
    `   - Prazo: 2 a 6 dias úteis.\n` +
    `   - Valor médio: *R$ ${correios}* (Frete Grátis acima de R$ ${freeMin})\n\n` +
    `3️⃣ *Retirada Grátis em Loja Física*:\n` +
    `   - Disponível em até 2 horas na *Loja Matriz Centro* ou *Loja Ipojuca*.\n\n` +
    `_Digite *0* para voltar ao Menu Principal._`
  );
}

export function getPixInfoText(productName = '', price = 69.90, botConfig = {}) {
  const finalPriceNum = Number(price || 69.90);
  const finalPriceStr = finalPriceNum.toFixed(2).replace('.', ',');
  const prod = productName ? `Referente a: *${productName}*\n` : '';
  const pixKey = botConfig.pix_key || 'financeiro@pitocodegente.com.br';
  const pixOwner = botConfig.pix_name || botConfig.pix_owner || 'Pitoco de Gente Artigos Infantis LTDA';
  const pixCity = botConfig.pix_city || 'Recife';

  const pixPayload = `00020126580014BR.GOV.BCB.PIX0136${pixKey}520400005303986540${finalPriceNum.toFixed(2)}5802BR5925Pitoco de Gente Artigos6006${pixCity.substring(0, 15)}62070503***6304`;

  return (
    `💳 *PAGAMENTO INSTANTÂNEO VIA PIX*\n\n` +
    prod +
    `💰 Valor: *R$ ${finalPriceStr}*\n` +
    `🔑 Chave PIX (E-mail): *${pixKey}*\n` +
    `👤 Favorecido: *${pixOwner}*\n` +
    `🏦 Banco: *Banco Inter / Efí*\n\n` +
    `📋 *Código Copia e Cola:*\n` +
    `\`\`\`${pixPayload}\`\`\`\n\n` +
    `✨ Após realizar a transferência, envie o comprovante por aqui mesmo. Nossa equipe confirmará o pedido imediatamente!\n\n` +
    `_Digite *0* para voltar ao Menu Principal._`
  );
}

export function getStoreHandoffMenuText(stores = PITOCO_STORES) {
  let txt = `👩‍💼 *ATENDIMENTO HUMANO — PITOCO DE GENTE*\nPor favor, escolha qual unidade você prefere para ser atendido(a):\n\n`;
  stores.forEach((s, idx) => {
    txt += `*${idx + 1}️⃣* *${s.name}* (${s.address || 'Central'})\n`;
  });
  txt += `\n_Digite o número correspondente (1 a ${stores.length}) ou *0* para voltar._`;
  return txt;
}

/**
 * Processador oficial do Bot Pitoco de Gente (Compatível com o Painel Admin)
 */
export async function processAdminBotMessage(incomingText, clientPhone, clientName, db) {
  const text = (incomingText || '').trim();
  const lower = text.toLowerCase();
  const botConfig = db.botConfig || db.botProfile || {};
  const products = (db.products && db.products.length > 0) ? db.products : PITOCO_SAMPLE_PRODUCTS;
  const stores = (db.stores && db.stores.length > 0) ? db.stores : PITOCO_STORES;

  if (!db.sessions) db.sessions = {};
  let session = db.sessions[clientPhone] || { step: 'IDLE', userName: clientName };

  // Atualizar nome se disponível
  if (clientName && (!session.userName || session.userName === 'Cliente')) {
    session.userName = clientName;
  }

  // Comandos de reset / início
  if (
    session.step === 'IDLE' || 
    text === '0' || 
    lower === 'menu' || 
    lower === 'oi' || 
    lower === 'olá' || 
    lower === 'ola' ||
    lower === 'inicio' ||
    lower === 'início' ||
    lower === 'começar' ||
    lower === 'comecar' ||
    lower === 'voltar'
  ) {
    session = { step: 'MAIN_MENU', userName: session.userName };
    db.sessions[clientPhone] = session;
    return getMainMenuText(session.userName, botConfig);
  }

  // 1. ESTADO: MENU PRINCIPAL (1 a 7)
  if (session.step === 'MAIN_MENU') {
    switch (text) {
      case '1': {
        let catText = `🛍️ *CATÁLOGO DE DESTAQUES — PITOCO DE GENTE*\n\n`;
        products.slice(0, 6).forEach((p, idx) => {
          const price = Number(p.promotional_price || p.price || 49.90).toFixed(2).replace('.', ',');
          catText += `*${idx + 1}.* *${p.name}*\n`;
          catText += `   💰 Preço: *R$ ${price}*\n`;
          if (p.material) catText += `   🧵 Tecido: ${p.material}\n`;
          if (p.sizes && Array.isArray(p.sizes)) catText += `   📏 Tamanhos: ${p.sizes.join(', ')}\n`;
          catText += `\n`;
        });
        catText += `_Digite o número do produto (1 a ${Math.min(6, products.length)}) para ver detalhes e pagar, ou *0* para o menu._`;
        session.step = 'CATALOG_BROWSING';
        db.sessions[clientPhone] = session;
        return catText;
      }

      case '2': {
        return getMeasureGuideText();
      }

      case '3': {
        return getLayetteChecklistText();
      }

      case '4': {
        session.step = 'VIP_CONSULTATION_STORE';
        db.sessions[clientPhone] = session;
        return (
          `👑 *CONSULTORIA VIP DE ENXOVAL PERSONALIZADA*\n` +
          `Nossa consultora especialista em bebês monta a lista completa do enxoval de acordo com a estação do ano do parto e seu orçamento!\n\n` +
          `Escolha a modalidade desejada:\n` +
          `1️⃣ Atendimento Online via Chamada de Vídeo / WhatsApp\n` +
          `2️⃣ Atendimento Presencial com Café & Recepção VIP na Loja\n\n` +
          `_Digite 1 ou 2, ou *0* para voltar._`
        );
      }

      case '5': {
        return getShippingInfoText(botConfig);
      }

      case '6': {
        return getPixInfoText('', 69.90, botConfig);
      }

      case '7': {
        session.step = 'SELECTING_STORE_HANDOFF';
        db.sessions[clientPhone] = session;
        return getStoreHandoffMenuText(stores);
      }

      default: {
        return `Opção inválida. Digite um número de *1 a 7*:\n\n` + getMainMenuText(session.userName, botConfig);
      }
    }
  }

  // 2. ESTADO: NAVEGAÇÃO DE CATÁLOGO
  if (session.step === 'CATALOG_BROWSING') {
    const prodIndex = parseInt(text, 10) - 1;
    if (prodIndex >= 0 && prodIndex < products.length) {
      const prod = products[prodIndex];
      const priceStr = Number(prod.promotional_price || prod.price || 49.90).toFixed(2).replace('.', ',');
      const sizesStr = Array.isArray(prod.sizes) ? prod.sizes.join(' | ') : 'RN | P | M | G';
      const colorsStr = Array.isArray(prod.colors) ? prod.colors.join(', ') : 'Cores variadas';

      const detailText =
        `✨ *${prod.name}*\n\n` +
        `📝 ${prod.description || 'Confeccionado com toque suave e antialérgico para a pele delicada do bebê.'}\n\n` +
        `💰 Valor: *R$ ${priceStr}*\n` +
        `🧵 Tecido: *${prod.material || 'Algodão Suedine 100%'}*\n` +
        `🎨 Cores: ${colorsStr}\n` +
        `📏 Tamanhos: *${sizesStr}*\n\n` +
        `Deseja reservar este item?\n` +
        `1️⃣ Comprar / Pagar via PIX com Frete\n` +
        `2️⃣ Falar com Consultora para tirar dúvidas\n` +
        `0️⃣ Voltar ao Menu Principal`;

      session.step = 'PRODUCT_DETAIL';
      session.selectedProductId = prod.id;
      session.selectedProductName = prod.name;
      session.cartTotal = Number(prod.promotional_price || prod.price || 49.90);
      db.sessions[clientPhone] = session;
      return detailText;
    }
    return `Por favor, digite o número do produto (1 a ${Math.min(6, products.length)}) ou *0* para o menu.`;
  }

  // 3. ESTADO: DETALHES DO PRODUTO
  if (session.step === 'PRODUCT_DETAIL') {
    if (text === '1') {
      session.step = 'MAIN_MENU';
      db.sessions[clientPhone] = session;
      return getPixInfoText(session.selectedProductName, session.cartTotal, botConfig);
    } else if (text === '2') {
      session.step = 'SELECTING_STORE_HANDOFF';
      db.sessions[clientPhone] = session;
      return getStoreHandoffMenuText(stores);
    }
  }

  // 4. ESTADO: SELEÇÃO DE LOJA PARA ATENDIMENTO HUMANO
  if (session.step === 'SELECTING_STORE_HANDOFF') {
    const storeIdx = parseInt(text, 10) - 1;
    if (storeIdx >= 0 && storeIdx < stores.length) {
      const chosenStore = stores[storeIdx];
      const protocol = `PTC-${Date.now().toString().slice(-6)}`;

      session.step = 'WAITING_HUMAN';
      session.selectedStoreId = chosenStore.id;
      session.selectedStoreName = chosenStore.name;
      db.sessions[clientPhone] = session;

      // Criar Ticket no banco para o Painel Admin
      if (!db.tickets) db.tickets = [];
      const newTicket = {
        id: `tkt-${Date.now()}`,
        protocol,
        client_name: session.userName || clientName || 'Cliente WhatsApp',
        client_phone: clientPhone,
        store_id: chosenStore.id,
        store_name: chosenStore.name,
        subject: 'Solicitação de Atendimento pelo Bot WhatsApp',
        status: 'open',
        priority: 'high',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.tickets.unshift(newTicket);

      // Atualizar Conversa para waiting_human
      if (!db.conversations) db.conversations = {};
      db.conversations[`conv-${clientPhone}`] = {
        id: `conv-${clientPhone}`,
        contact_name: session.userName || clientName || 'Cliente WhatsApp',
        phone: clientPhone,
        store_id: chosenStore.id,
        store_name: chosenStore.name,
        status: 'waiting_human',
        last_message: `Cliente solicitou atendimento para ${chosenStore.name} (Protocolo: ${protocol})`,
        last_message_at: new Date().toISOString(),
      };

      return (
        `✅ *SOLICITAÇÃO RECEBIDA COM SUCESSO!*\n\n` +
        `🏬 Loja vinculada: *${chosenStore.name}*\n` +
        `📍 Endereço: ${chosenStore.address}\n` +
        `📋 Protocolo de atendimento: *${protocol}*\n\n` +
        `Uma de nossas consultoras especializadas desta unidade já recebeu sua conversa no painel e vai te responder aqui em instantes! 💕\n\n` +
        `_Aguarde um momento por favor..._`
      );
    }
    return `Por favor, selecione 1, 2 ou 3 para definir a loja de atendimento:\n\n` + getStoreHandoffMenuText(stores);
  }

  // 5. ESTADO: CONSULTORIA VIP (MODALIDADE)
  if (session.step === 'VIP_CONSULTATION_STORE') {
    const mode = text === '1' ? 'Online (WhatsApp / Vídeo)' : 'Presencial com Café VIP em Loja';
    session.step = 'VIP_CONSULTATION_DATE';
    session.vipMode = mode;
    db.sessions[clientPhone] = session;
    return (
      `📅 Modalidade escolhida: *${mode}*\n\n` +
      `Por favor, digite a data aproximada do seu parto (DPP) ou a melhor data e horário para a consultoria (ex: 25/10 às 15h):`
    );
  }

  // 6. ESTADO: CONSULTORIA VIP (DATA)
  if (session.step === 'VIP_CONSULTATION_DATE') {
    session.step = 'MAIN_MENU';
    db.sessions[clientPhone] = session;

    if (!db.appointments) db.appointments = [];
    db.appointments.unshift({
      id: `apt-${Date.now()}`,
      contact_name: session.userName || clientName || 'Cliente WhatsApp',
      phone: clientPhone,
      service_name: `Consultoria VIP de Enxoval (${session.vipMode || 'Personalizada'})`,
      date: text,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    return (
      `🎉 *CONSULTORIA VIP REGISTRADA!*\n` +
      `Anotamos sua preferência de data: *${text}*.\n\n` +
      `Nossa consultora especialista entrará em contato em breve para confirmar o agendamento e preparar as novidades exclusivas para o seu bebê! 🍼🧸\n\n` +
      `_Digite *0* para voltar ao Menu Principal._`
    );
  }

  // 7. SE JÁ ESTÁ AGUARDANDO HUMANO
  if (session.step === 'WAITING_HUMAN') {
    return `Sua mensagem foi recebida! Uma consultora da *${session.selectedStoreName || 'Pitoco de Gente'}* já está visualizando e vai te responder a qualquer momento.`;
  }

  // Fallback padrão
  session.step = 'MAIN_MENU';
  db.sessions[clientPhone] = session;
  return getMainMenuText(session.userName, botConfig);
}
