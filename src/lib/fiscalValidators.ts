/**
 * UTILITÁRIOS E VALIDADORES FISCAIS - GSR FINANÇAS
 * Implementação matemática estrita conforme padrões da Receita Federal do Brasil (RFB)
 */

/**
 * Validação de CPF por cálculo de dígitos verificadores (Módulo 11)
 * Rejeita valores com menos de 11 dígitos e sequências idênticas (ex: 111.111.111-11)
 */
export const validarCPF = (cpf: string): boolean => {
  const limpo = cpf.replace(/\D/g, '');

  if (limpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  let soma = 0;
  let resto: number;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(limpo.substring(i - 1, i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.substring(9, 10), 10)) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(limpo.substring(i - 1, i), 10) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.substring(10, 11), 10)) return false;

  return true;
};

/**
 * Validação de CNPJ por cálculo de dígitos verificadores (Módulo 11)
 */
export const validarCNPJ = (cnpj: string): boolean => {
  const limpo = cnpj.replace(/\D/g, '');

  if (limpo.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(limpo)) return false;

  let tamanho = limpo.length - 2;
  let numeros = limpo.substring(0, tamanho);
  const digitos = limpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0), 10)) return false;

  tamanho = tamanho + 1;
  numeros = limpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1), 10)) return false;

  return true;
};

/**
 * Validação unificada (detecta automaticamente se é CPF ou CNPJ)
 */
export const validarDocumentoFiscal = (doc: string): boolean => {
  const limpo = doc.replace(/\D/g, '');
  if (limpo.length === 11) return validarCPF(limpo);
  if (limpo.length === 14) return validarCNPJ(limpo);
  return false;
};

/**
 * Formata CPF: 000.000.000-00
 */
export const formatarCPF = (cpf: string): string => {
  const digits = cpf.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return digits.replace(/(\d{3})(\d+)/, '$1.$2');
  if (digits.length <= 9) return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
};

/**
 * Formata CNPJ: 00.000.000/0000-00
 */
export const formatarCNPJ = (cnpj: string): string => {
  const digits = cnpj.replace(/\D/g, '').slice(0, 14);
  return digits.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    '$1.$2.$3/$4-$5'
  );
};

/**
 * Aplica máscara dinâmica baseada no tamanho da string digitada
 */
export const formatarDocumentoDinamico = (val: string): string => {
  const limpo = val.replace(/\D/g, '');
  if (limpo.length <= 11) {
    return formatarCPF(limpo);
  }
  return formatarCNPJ(limpo);
};

export const limparDocumento = (doc: string): string => {
  return doc.replace(/\D/g, '');
};
