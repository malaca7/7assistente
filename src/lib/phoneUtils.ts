/**
 * Utilitário Canônico de Variações de Telefones Brasileiros
 * Gera e compara com precisão todas as 4 variações:
 * 1) 5581996138924  (DDI 55 + DDD 81 + 9 dígitos - 13 dígitos)
 * 2) 81996138924    (DDD 81 + 9 dígitos - 11 dígitos)
 * 3) 8196138924     (DDD 81 + 8 dígitos legado - 10 dígitos)
 * 4) 558196138924   (DDI 55 + DDD 81 + 8 dígitos legado - 12 dígitos)
 */

export function getBrazilianPhoneVariations(phone: string): string[] {
  if (!phone) return [];
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return [];

  // Remove zeros à esquerda (ex: 081996138924 -> 81996138924)
  digits = digits.replace(/^0+/, '');

  const variations = new Set<string>();
  variations.add(digits);

  // Se for LID do WhatsApp (14+ dígitos ou iniciado por 1686 / 219), não tentar deduzir DDD móvel
  if (digits.length > 13 || digits.startsWith('1686') || digits.startsWith('219')) {
    return Array.from(variations);
  }

  let ddd = '';
  let numberPart = '';

  if (digits.startsWith('55') && digits.length >= 12) {
    ddd = digits.substring(2, 4);
    numberPart = digits.substring(4);
  } else if (digits.length === 10 || digits.length === 11) {
    ddd = digits.substring(0, 2);
    numberPart = digits.substring(2);
  } else if (digits.length === 8 || digits.length === 9) {
    if (digits.length === 9 && digits.startsWith('9')) {
      variations.add(digits.substring(1));
    } else if (digits.length === 8) {
      variations.add(`9${digits}`);
    }
    return Array.from(variations);
  }

  if (ddd && numberPart) {
    let num9 = '';
    let num8 = '';

    if (numberPart.length === 9) {
      num9 = numberPart;
      if (numberPart.startsWith('9')) {
        num8 = numberPart.substring(1);
      }
    } else if (numberPart.length === 8) {
      num8 = numberPart;
      num9 = `9${numberPart}`;
    }

    // 1) DDI + DDD + 9 dígitos (ex: 5581996138924)
    if (num9) variations.add(`55${ddd}${num9}`);
    // 2) DDD + 9 dígitos (ex: 81996138924)
    if (num9) variations.add(`${ddd}${num9}`);
    // 3) DDD + 8 dígitos legado (ex: 8196138924)
    if (num8) variations.add(`${ddd}${num8}`);
    // 4) DDI + DDD + 8 dígitos legado (ex: 558196138924)
    if (num8) variations.add(`55${ddd}${num8}`);

    if (num9) variations.add(num9);
    if (num8) variations.add(num8);
  }

  return Array.from(variations);
}

/**
 * Compara dois números de telefone brasileiros e verifica se correspondem à mesma linha
 * independente de terem 55, 9º dígito ou formatação.
 */
export function areBrazilianPhonesMatching(phoneA: string, phoneB: string): boolean {
  if (!phoneA || !phoneB) return false;
  const digitsA = String(phoneA).replace(/\D/g, '');
  const digitsB = String(phoneB).replace(/\D/g, '');
  if (!digitsA || !digitsB) return false;
  if (digitsA === digitsB) return true;

  const varsA = getBrazilianPhoneVariations(digitsA);
  const varsB = getBrazilianPhoneVariations(digitsB);

  return varsA.some((va) => va === digitsB || varsB.includes(va));
}
