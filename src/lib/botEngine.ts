// Pitoco de Gente — Motor do Bot de Atendimento & Vendas WhatsApp
import { 
  Store, 
  Product, 
  VIPConsultation, 
  SupportTicket, 
  MeasureGuideItem 
} from '../types';

export interface BotState {
  step: 
    | 'IDLE'
    | 'MAIN_MENU'
    | 'CATALOG_BROWSING'
    | 'PRODUCT_DETAIL'
    | 'SELECTING_SIZE'
    | 'SELECTING_COLOR'
    | 'CHECKING_FRETE'
    | 'CHECKOUT_PIX'
    | 'VIP_CONSULTATION_DATE'
    | 'VIP_CONSULTATION_STORE'
    | 'SELECTING_STORE_HANDOFF'
    | 'WAITING_HUMAN';
  selectedProductId?: string;
  selectedSize?: string;
  selectedColor?: string;
  selectedStoreId?: string;
  selectedStoreName?: string;
  vipDate?: string;
  cartTotal?: number;
  userName?: string;
}

export interface BotResponse {
  replyText: string;
  mediaUrl?: string;
  newState: BotState;
  triggerHandoff?: boolean;
  handoffStoreId?: string;
  ticketCreated?: boolean;
}

export const PITOCO_MEASURE_GUIDE: MeasureGuideItem[] = [
  { size: 'RN', ageRange: '0 a 1 mês', weightRange: '2,5 a 4 kg', heightRange: 'até 52 cm', description: 'Ideal para os primeiros dias e mala de maternidade' },
  { size: 'P', ageRange: '1 a 3 meses', weightRange: '4 a 6 kg', heightRange: '52 a 62 cm', description: 'Mês a mês inicial com conforto máximo' },
  { size: 'M', ageRange: '3 a 6 meses', weightRange: '6 a 8 kg', heightRange: '62 a 67 cm', description: 'Fase de descobertas e rolinhos' },
  { size: 'G', ageRange: '6 a 9 meses', weightRange: '8 a 9,5 kg', heightRange: '67 a 72 cm', description: 'Início da introdução alimentar' },
  { size: 'GG', ageRange: '9 a 12 meses', weightRange: '9,5 a 11 kg', heightRange: '72 a 77 cm', description: 'Primeiros passinhos com pezinho livre' },
  { size: '1 ano', ageRange: '12 a 18 meses', weightRange: '11 a 12,5 kg', heightRange: '77 a 82 cm', description: 'Roupinhas reforçadas e flexíveis' },
  { size: '2 anos', ageRange: '18 a 24 meses', weightRange: '12,5 a 14 kg', heightRange: '82 a 88 cm', description: 'Fase ativa de brincadeiras' },
  { size: '3 anos', ageRange: '2 a 3 anos', weightRange: '14 a 16 kg', heightRange: '88 a 98 cm', description: 'Total liberdade de movimento' },
];

export const PITOCO_STORES: Store[] = [
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
    monthly_revenue: 48500,
  },
  {
    id: 'store-002',
    name: 'Loja Shopping Boulevard',
    slug: 'boulevard',
    address: 'Av. Principal, 500 - Loja 204 - Shopping Boulevard',
    phone: '8134422000',
    whatsapp_number: '81996138924',
    is_active: true,
    business_hours: '10:00 às 22:00',
    city: 'Recife - PE',
    monthly_revenue: 62300,
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
    monthly_revenue: 95800,
  },
];

export const PITOCO_SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    category_id: 'cat-001',
    category_name: 'Bodies',
    name: 'Body Manga Longa Algodão Suedine 100% Pima',
    description: 'Puro algodão suedine 100% egípcio com toque sedoso e gola envelope antialérgica.',
    price: 49.90,
    promotional_price: 39.90,
    sizes: ['RN', 'P', 'M', 'G', 'GG'],
    colors: ['Branco Puro', 'Azul Bebê', 'Rosa Seco', 'Verde Menta'],
    stock_quantity: 120,
    is_featured: true,
    is_active: true,
    material: 'Algodão Suedine 100%',
  },
  {
    id: 'prod-002',
    category_id: 'cat-002',
    category_name: 'Macacões',
    name: 'Macacão Canelado com Zíper Duplo Soft',
    description: 'Zíper com duplo cursor (abre por cima e por baixo), proteção para a pele e pezinho reversível.',
    price: 79.90,
    promotional_price: 69.90,
    sizes: ['RN', 'P', 'M', 'G', '1 ano'],
    colors: ['Azul Bebê', 'Rosa Seco', 'Verde Menta', 'Bege Neutro'],
    stock_quantity: 85,
    is_featured: true,
    is_active: true,
    material: 'Algodão Canelado Premium',
  },
  {
    id: 'prod-003',
    category_id: 'cat-003',
    category_name: 'Saídas de Maternidade',
    name: 'Saída de Maternidade Tricot Luxo Realeza 4 Peças',
    description: 'Macacão bordado, manta aconchegante, touquinha e luvinhas em tricot térmico antialérgico.',
    price: 189.90,
    promotional_price: 169.90,
    sizes: ['RN', 'P'],
    colors: ['Branco Puro', 'Rosa Seco', 'Azul Bebê', 'Amarelo Manteiga'],
    stock_quantity: 45,
    is_featured: true,
    is_active: true,
    material: 'Tricot Luxo Antialérgico',
  },
  {
    id: 'prod-004',
    category_id: 'cat-004',
    category_name: 'Kits de Berço',
    name: 'Kit Berço Algodão 400 Fios Trança Nuvem',
    description: 'Lateral em trança macia, cabeceira nuvem, lençol 400 fios e fronha antissufocante.',
    price: 289.90,
    promotional_price: 259.90,
    sizes: ['RN', 'P', 'M', 'G'],
    colors: ['Branco Puro', 'Verde Menta', 'Bege Neutro'],
    stock_quantity: 30,
    is_featured: true,
    is_active: true,
    material: 'Algodão Percal 400 Fios Acetinado',
  },
  {
    id: 'prod-005',
    category_id: 'cat-005',
    category_name: 'Mala Maternidade',
    name: 'Mala Maternidade Térmica Master Impermeável',
    description: 'Espaço térmico com divisórias para as 48h no hospital e bolsos para mamadeiras.',
    price: 219.90,
    promotional_price: 199.90,
    sizes: ['G', 'GG'],
    colors: ['Bege Neutro', 'Rosa Seco', 'Azul Bebê'],
    stock_quantity: 40,
    is_featured: false,
    is_active: true,
    material: 'Couro Ecológico Impermeável Soft',
  },
];

export function getMainMenuText(userName?: string): string {
  const greeting = userName ? `Olá, *${userName}*!` : 'Olá, mamãe e papai!';
  return (
    `👶✨ *PITOCO DE GENTE — Roupas de Bebê & Enxovais*\n` +
    `${greeting} Bem-vindo(a) à nossa loja oficial! Como podemos te ajudar hoje?\n\n` +
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

export function getMeasureGuideText(): string {
  let txt = `📏 *GUIA DE MEDIDAS OFICIAL — PITOCO DE GENTE*\n\n`;
  PITOCO_MEASURE_GUIDE.forEach(item => {
    txt += `▫️ *Tamanho ${item.size}* (${item.ageRange})\n`;
    txt += `   ⚖️ Peso: ${item.weightRange} | 📐 Altura: ${item.heightRange}\n`;
    txt += `   💡 _${item.description}_\n\n`;
  });
  txt += `_Digite *0* para voltar ao Menu Principal._`;
  return txt;
}

export function getLayetteChecklistText(): string {
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

export function getShippingInfoText(): string {
  return (
    `🚚 *FORMAS DE ENTREGA & FRETE — PITOCO DE GENTE*\n\n` +
    `1️⃣ *Motoboy Express (Recife e RMR)*:\n` +
    `   - Entrega no mesmo dia para pedidos até 14h.\n` +
    `   - Valor fixo: *R$ 15,00* (Grátis em compras acima de R$ 250,00)\n\n` +
    `2️⃣ *Correios (Todo o Brasil via SEDEX ou PAC)*:\n` +
    `   - Prazo: 2 a 6 dias úteis.\n` +
    `   - Valor médio: *R$ 24,90* (Frete Grátis acima de R$ 299,00)\n\n` +
    `3️⃣ *Retirada Grátis em Loja Física*:\n` +
    `   - Disponível em até 2 horas na *Loja Matriz Centro* ou *Shopping Boulevard*.\n\n` +
    `_Digite *0* para voltar ao Menu Principal._`
  );
}

export function getPixInfoText(productName?: string, price?: number): string {
  const finalPrice = price ? price.toFixed(2).replace('.', ',') : '69,90';
  const prod = productName ? `Referente a: *${productName}*\n` : '';
  const pixKey = 'financeiro@pitocodegente.com.br';
  const pixPayload = `00020126580014BR.GOV.BCB.PIX0136${pixKey}520400005303986540${price ? price.toFixed(2) : '69.90'}5802BR5925Pitoco de Gente Artigos6006Recife62070503***6304`;

  return (
    `💳 *PAGAMENTO INSTANTÂNEO VIA PIX*\n\n` +
    prod +
    `💰 Valor: *R$ ${finalPrice}*\n` +
    `🔑 Chave PIX (E-mail): *${pixKey}*\n` +
    `👤 Favorecido: *Pitoco de Gente Artigos Infantis LTDA*\n` +
    `🏦 Banco: *Banco Inter / Efí*\n\n` +
    `📋 *Código Copia e Cola:*\n` +
    `\`\`\`${pixPayload}\`\`\`\n\n` +
    `✨ Após realizar a transferência, envie o comprovante por aqui mesmo. Nossa equipe confirmará o pedido imediatamente!\n\n` +
    `_Digite *0* para voltar ao Menu Principal._`
  );
}

export function getStoreHandoffMenuText(): string {
  return (
    `👩‍💼 *ATENDIMENTO HUMANO — PITOCO DE GENTE*\n` +
    `Por favor, escolha qual unidade você prefere para ser atendido(a):\n\n` +
    `1️⃣ *Loja Matriz — Centro* (Rua do Sol, 120)\n` +
    `2️⃣ *Loja Shopping Boulevard* (Piso L2, Loja 204)\n` +
    `3️⃣ *Atendimento Geral / E-commerce* (Central Digital)\n\n` +
    `_Digite o número correspondente (1, 2 ou 3) ou *0* para voltar._`
  );
}

/**
 * Processador central de mensagens do Bot Pitoco de Gente
 */
export async function processBotMessage(
  incomingText: string,
  state: BotState = { step: 'IDLE' },
  clientInfo?: { name?: string; phone?: string }
): Promise<BotResponse> {
  const text = incomingText.trim();
  const lower = text.toLowerCase();

  // Se digitar menu, oi, ola ou 0 -> Volta ao Menu Principal
  if (
    state.step === 'IDLE' || 
    text === '0' || 
    lower === 'menu' || 
    lower === 'oi' || 
    lower === 'olá' || 
    lower === 'inicio' ||
    lower === 'começar'
  ) {
    return {
      replyText: getMainMenuText(clientInfo?.name),
      newState: { step: 'MAIN_MENU', userName: clientInfo?.name },
    };
  }

  // ESTADO: MENU PRINCIPAL
  if (state.step === 'MAIN_MENU') {
    switch (text) {
      case '1': {
        // Exibir catálogo interativo
        let catText = `🛍️ *CATÁLOGO DE DESTAQUES — PITOCO DE GENTE*\n\n`;
        PITOCO_SAMPLE_PRODUCTS.forEach((p, idx) => {
          const promo = p.promotional_price ? ` ~R$ ${p.price.toFixed(2).replace('.', ',')}~ por *R$ ${p.promotional_price.toFixed(2).replace('.', ',')}*` : ` *R$ ${p.price.toFixed(2).replace('.', ',')}*`;
          catText += `*${idx + 1}.* ${p.name}\n`;
          catText += `   💰 Preço:${promo}\n`;
          catText += `   🧵 Material: ${p.material}\n`;
          catText += `   📏 Tamanhos: ${p.sizes.join(', ')}\n\n`;
        });
        catText += `_Digite o número do produto (1 a ${PITOCO_SAMPLE_PRODUCTS.length}) para ver detalhes, tamanhos e comprar, ou *0* para o menu._`;
        return {
          replyText: catText,
          newState: { step: 'CATALOG_BROWSING' },
        };
      }

      case '2': {
        return {
          replyText: getMeasureGuideText(),
          newState: { step: 'MAIN_MENU' },
        };
      }

      case '3': {
        return {
          replyText: getLayetteChecklistText(),
          newState: { step: 'MAIN_MENU' },
        };
      }

      case '4': {
        return {
          replyText:
            `👑 *CONSULTORIA VIP DE ENXOVAL PERSONALIZADA*\n` +
            `Nossa consultora especialista em bebês monta a lista completa do enxoval de acordo com a estação do ano do parto e seu orçamento!\n\n` +
            `Escolha a modalidade desejada:\n` +
            `1️⃣ Atendimento Online via Chamada de Vídeo / WhatsApp\n` +
            `2️⃣ Atendimento Presencial com Café & Recepção VIP na Loja\n\n` +
            `_Digite 1 ou 2, ou *0* para voltar._`,
          newState: { step: 'VIP_CONSULTATION_STORE' },
        };
      }

      case '5': {
        return {
          replyText: getShippingInfoText(),
          newState: { step: 'MAIN_MENU' },
        };
      }

      case '6': {
        return {
          replyText: getPixInfoText(),
          newState: { step: 'MAIN_MENU' },
        };
      }

      case '7': {
        return {
          replyText: getStoreHandoffMenuText(),
          newState: { step: 'SELECTING_STORE_HANDOFF' },
        };
      }

      default:
        return {
          replyText: `Opção inválida. Digite um número de *1 a 7*:\n\n` + getMainMenuText(clientInfo?.name),
          newState: { step: 'MAIN_MENU' },
        };
    }
  }

  // ESTADO: NAVEGAÇÃO DE CATÁLOGO
  if (state.step === 'CATALOG_BROWSING') {
    const prodIndex = parseInt(text, 10) - 1;
    if (prodIndex >= 0 && prodIndex < PITOCO_SAMPLE_PRODUCTS.length) {
      const prod = PITOCO_SAMPLE_PRODUCTS[prodIndex];
      const priceStr = (prod.promotional_price || prod.price).toFixed(2).replace('.', ',');
      const detailText =
        `✨ *${prod.name}*\n\n` +
        `📝 ${prod.description}\n\n` +
        `💰 Valor: *R$ ${priceStr}*\n` +
        `🧵 Tecido: *${prod.material}*\n` +
        `🎨 Cores disponíveis: ${prod.colors.join(', ')}\n` +
        `📏 Tamanhos disponíveis: *${prod.sizes.join(' | ')}*\n\n` +
        `Deseja reservar este item?\n` +
        `1️⃣ Comprar / Pagar via PIX com Frete\n` +
        `2️⃣ Falar com Consultora para tirar dúvidas\n` +
        `0️⃣ Voltar ao Menu Principal`;

      return {
        replyText: detailText,
        newState: {
          step: 'PRODUCT_DETAIL',
          selectedProductId: prod.id,
          cartTotal: prod.promotional_price || prod.price,
        },
      };
    }
    return {
      replyText: `Por favor, digite o número do produto (1 a ${PITOCO_SAMPLE_PRODUCTS.length}) ou *0* para o menu.`,
      newState: { step: 'CATALOG_BROWSING' },
    };
  }

  // ESTADO: DETALHES DO PRODUTO
  if (state.step === 'PRODUCT_DETAIL') {
    const selectedProd = PITOCO_SAMPLE_PRODUCTS.find(p => p.id === state.selectedProductId);
    if (text === '1') {
      return {
        replyText: getPixInfoText(selectedProd?.name, state.cartTotal),
        newState: { step: 'CHECKOUT_PIX' },
      };
    } else if (text === '2') {
      return {
        replyText: getStoreHandoffMenuText(),
        newState: { step: 'SELECTING_STORE_HANDOFF', selectedProductId: state.selectedProductId },
      };
    }
  }

  // ESTADO: SELEÇÃO DE LOJA PARA TRANSBORDO HUMANO
  if (state.step === 'SELECTING_STORE_HANDOFF') {
    let chosenStore: Store | undefined;
    if (text === '1') chosenStore = PITOCO_STORES[0];
    else if (text === '2') chosenStore = PITOCO_STORES[1];
    else if (text === '3') chosenStore = PITOCO_STORES[2];

    if (chosenStore) {
      const protocol = `PTC-${Date.now().toString().slice(-6)}`;
      const reply =
        `✅ *SOLICITAÇÃO RECEBIDA COM SUCESSO!*\n\n` +
        `🏬 Loja vinculada: *${chosenStore.name}*\n` +
        `📍 Endereço: ${chosenStore.address}\n` +
        `📋 Protocolo de atendimento: *${protocol}*\n\n` +
        `Uma de nossas consultoras especializadas desta unidade já recebeu sua conversa e vai te responder aqui em instantes! 💕\n\n` +
        `_Aguarde um momento por favor..._`;

      return {
        replyText: reply,
        newState: {
          step: 'WAITING_HUMAN',
          selectedStoreId: chosenStore.id,
          selectedStoreName: chosenStore.name,
        },
        triggerHandoff: true,
        handoffStoreId: chosenStore.id,
        ticketCreated: true,
      };
    }

    return {
      replyText: `Por favor, selecione 1, 2 ou 3 para definir a loja de atendimento:\n\n` + getStoreHandoffMenuText(),
      newState: { step: 'SELECTING_STORE_HANDOFF' },
    };
  }

  // ESTADO: AGENDAMENTO CONSULTORIA VIP
  if (state.step === 'VIP_CONSULTATION_STORE') {
    const mode = text === '1' ? 'Online (WhatsApp)' : 'Presencial (Loja)';
    return {
      replyText:
        `📅 Modalidade escolhida: *${mode}*\n\n` +
        `Por favor, digite a data aproximada do seu parto (DPP) ou a melhor data para a consultoria (ex: 20/10 às 15h):`,
      newState: { step: 'VIP_CONSULTATION_DATE' },
    };
  }

  if (state.step === 'VIP_CONSULTATION_DATE') {
    return {
      replyText:
        `🎉 *CONSULTORIA VIP AGENDADA!*\n` +
        `Registramos sua preferência: *${text}*.\n\n` +
        `Nossa consultora master entrará em contato em breve para confirmar o horário e preparar um catálogo exclusivo para o seu bebê! 🍼🧸\n\n` +
        `_Digite *0* para voltar ao Menu Principal._`,
      newState: { step: 'MAIN_MENU' },
    };
  }

  // Se já está aguardando humano, não interfere
  if (state.step === 'WAITING_HUMAN') {
    return {
      replyText: `Sua conversa já está com uma consultora da *${state.selectedStoreName || 'Pitoco de Gente'}*. Ela já está visualizando sua mensagem e responderá em breve!`,
      newState: state,
    };
  }

  // Fallback padrão
  return {
    replyText: getMainMenuText(clientInfo?.name),
    newState: { step: 'MAIN_MENU' },
  };
}
