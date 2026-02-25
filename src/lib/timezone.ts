/**
 * Utilitário para manipulação de datas com suporte a timezone do usuário.
 *
 * O problema: O servidor (que pode estar em UTC ou outro timezone) precisa
 * calcular datas e dias da semana baseados no fuso horário LOCAL do usuário.
 *
 * Exemplo: Se são 21h de domingo em São Paulo (GMT-3), em UTC já é segunda-feira.
 * Se o servidor está em UTC, new Date().getDay() retornaria 1 (segunda), mas
 * para o usuário em São Paulo ainda é domingo (0).
 */

/**
 * Obtém a data atual no timezone especificado
 * @param timezone - IANA timezone string (ex: "America/Sao_Paulo")
 * @returns Data ajustada para o timezone
 */
export function getDataAtualNoTimezone(timezone: string): Date {
  const agora = new Date();

  // Formatar a data no timezone do usuário
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const partes = formatter.formatToParts(agora);
  const valores: Record<string, string> = {};

  for (const parte of partes) {
    valores[parte.type] = parte.value;
  }

  // Criar uma nova data com os valores do timezone do usuário
  // Isso garante que getDay(), getDate(), etc. retornem valores corretos
  return new Date(
    parseInt(valores.year),
    parseInt(valores.month) - 1,
    parseInt(valores.day),
    parseInt(valores.hour),
    parseInt(valores.minute),
    parseInt(valores.second)
  );
}

/**
 * Obtém o início do dia (00:00:00) no timezone especificado
 * @param timezone - IANA timezone string
 * @returns Data no início do dia
 */
export function getInicioDoDiaNoTimezone(timezone: string): Date {
  const dataAtual = getDataAtualNoTimezone(timezone);
  dataAtual.setHours(0, 0, 0, 0);
  return dataAtual;
}

/**
 * Obtém o dia da semana (0-6) no timezone especificado
 * @param timezone - IANA timezone string
 * @returns Dia da semana (0 = Domingo, 6 = Sábado)
 */
export function getDiaSemanaNoTimezone(timezone: string): number {
  return getDataAtualNoTimezone(timezone).getDay();
}

/**
 * Converte uma string de data (YYYY-MM-DD) para Date no início do dia
 * @param dataStr - String no formato YYYY-MM-DD
 * @returns Date object
 */
export function parseDataString(dataStr: string): Date {
  const [ano, mes, dia] = dataStr.split('-').map(Number);
  return new Date(ano, mes - 1, dia, 0, 0, 0, 0);
}

/**
 * Converte uma Date para string no formato YYYY-MM-DD
 * @param data - Date object
 * @returns String no formato YYYY-MM-DD
 */
export function formatarDataString(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/**
 * Cria uma data X dias atrás a partir de uma data base
 * @param dataBase - Data de referência
 * @param dias - Número de dias para subtrair
 * @returns Nova data
 */
export function subtrairDias(dataBase: Date, dias: number): Date {
  const novaData = new Date(dataBase);
  novaData.setDate(novaData.getDate() - dias);
  return novaData;
}

/**
 * Cria uma data X dias à frente a partir de uma data base
 * @param dataBase - Data de referência
 * @param dias - Número de dias para adicionar
 * @returns Nova data
 */
export function adicionarDias(dataBase: Date, dias: number): Date {
  const novaData = new Date(dataBase);
  novaData.setDate(novaData.getDate() + dias);
  return novaData;
}

/**
 * Calcula a diferença em dias entre duas datas
 * @param data1 - Primeira data
 * @param data2 - Segunda data
 * @returns Número de dias de diferença
 */
export function diferencaEmDias(data1: Date, data2: Date): number {
  const d1 = new Date(data1);
  d1.setHours(0, 0, 0, 0);
  const d2 = new Date(data2);
  d2.setHours(0, 0, 0, 0);
  return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Normaliza uma data para o início do dia (00:00:00)
 * @param data - Data a ser normalizada
 * @returns Nova data normalizada
 */
export function normalizarParaInicioDoDia(data: Date): Date {
  const novaData = new Date(data);
  novaData.setHours(0, 0, 0, 0);
  return novaData;
}

/**
 * Obtém o timezone padrão (fallback) baseado no ambiente
 * Pode ser configurado via variável de ambiente
 */
export function getTimezoneDefault(): string {
  return process.env.DEFAULT_TIMEZONE || 'America/Sao_Paulo';
}

/**
 * Valida se um timezone é válido
 * @param timezone - String de timezone a validar
 * @returns true se válido
 */
export function isTimezoneValido(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtém o timezone da requisição, com fallback para o padrão
 * @param timezoneParam - Timezone recebido como parâmetro
 * @returns Timezone válido
 */
export function getTimezoneFromRequest(timezoneParam: string | null): string {
  if (timezoneParam && isTimezoneValido(timezoneParam)) {
    return timezoneParam;
  }
  return getTimezoneDefault();
}
