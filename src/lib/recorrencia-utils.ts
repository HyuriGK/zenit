// src/lib/recorrencia-utils.ts
// Funções auxiliares para lidar com compromissos recorrentes

import { addDays, addWeeks, addMonths, addYears, isBefore, isAfter } from 'date-fns';
import { TipoRecorrencia } from '@/types/compromisso';

interface GerarRecorrenciasParams {
  dataInicial: Date;
  tipoRecorrencia: TipoRecorrencia;
  intervalo: number;
  dataFim?: Date;
  maxOcorrencias?: number;
}

/**
 * Gera as datas para compromissos recorrentes
 */
export function gerarDatasRecorrentes({
  dataInicial,
  tipoRecorrencia,
  intervalo,
  dataFim,
  maxOcorrencias = 52, // Default: 1 ano de semanas
}: GerarRecorrenciasParams): Date[] {
  const datas: Date[] = [dataInicial];
  let dataAtual = new Date(dataInicial);
  
  // Se não houver data fim, define um limite padrão de 1 ano
  const dataLimite = dataFim || addYears(dataInicial, 1);
  
  let contador = 1;
  
  while (contador < maxOcorrencias) {
    // Calcula próxima data baseado no tipo de recorrência
    switch (tipoRecorrencia) {
      case 'diario':
        dataAtual = addDays(dataAtual, intervalo);
        break;
      case 'semanal':
        dataAtual = addWeeks(dataAtual, intervalo);
        break;
      case 'mensal':
        dataAtual = addMonths(dataAtual, intervalo);
        break;
      case 'anual':
        dataAtual = addYears(dataAtual, intervalo);
        break;
    }
    
    // Verifica se ultrapassou a data limite
    if (isAfter(dataAtual, dataLimite)) {
      break;
    }
    
    datas.push(new Date(dataAtual));
    contador++;
  }
  
  return datas;
}

/**
 * Calcula quantas ocorrências serão criadas
 */
export function calcularQuantidadeOcorrencias(params: GerarRecorrenciasParams): number {
  return gerarDatasRecorrentes(params).length;
}

/**
 * Retorna descrição amigável da recorrência
 * @param tipo - Tipo de recorrência
 * @param intervalo - Intervalo de recorrência
 * @param t - Função de tradução (opcional, para componentes React)
 */
export function getDescricaoRecorrencia(
  tipo: TipoRecorrencia,
  intervalo: number,
  t?: (key: string, params?: any) => string
): string {
  if (!tipo) {
    return t ? t('recurring') : 'Recorrente';
  }

  // Se a função de tradução não foi fornecida, retorna textos em português
  if (!t) {
    const textos = {
      diario: intervalo === 1 ? 'Todos os dias' : `A cada ${intervalo} dias`,
      semanal: intervalo === 1 ? 'Toda semana' : `A cada ${intervalo} semanas`,
      mensal: intervalo === 1 ? 'Todo mês' : `A cada ${intervalo} meses`,
      anual: intervalo === 1 ? 'Todo ano' : `A cada ${intervalo} anos`,
    };
    return textos[tipo] || 'Recorrente';
  }

  // Usa as traduções quando disponível
  const textos = {
    diario: intervalo === 1 ? t('everyDay') : t('everyNDays', { count: intervalo }),
    semanal: intervalo === 1 ? t('everyWeek') : t('everyNWeeks', { count: intervalo }),
    mensal: intervalo === 1 ? t('everyMonth') : t('everyNMonths', { count: intervalo }),
    anual: intervalo === 1 ? t('everyYear') : t('everyNYears', { count: intervalo }),
  };

  return textos[tipo] || t('recurring');
}

/**
 * Gera um ID único para agrupar compromissos da mesma série
 */
export function gerarRecorrenciaGrupoId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}