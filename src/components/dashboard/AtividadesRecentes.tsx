'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';
import {
  Calendar,
  CalendarCheck,
  CalendarX,
  Edit3,
  Activity,
  Clock,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/dexie';

interface Atividade {
  id: string;
  tipo: string;
  titulo: string;
  descricao?: string;
  icone: string;
  cor: string;
  createdAt: string;
}

const getIcone = (icone: string) => {
  const icones: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    'calendar': Calendar,
    'calendar-check': CalendarCheck,
    'calendar-x': CalendarX,
    'edit': Edit3,
    'activity': Activity,
  };
  return icones[icone] || Activity;
};

const getTipoTexto = (tipo: string, t: (key: string) => string) => {
  const tipos: Record<string, { texto: string; cor: string }> = {
    'compromisso_criado': { texto: t('created'), cor: 'bg-green-500/10 text-green-400 border-green-500/20' },
    'compromisso_editado': { texto: t('edited'), cor: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    'compromisso_excluido': { texto: t('deleted'), cor: 'bg-red-500/10 text-red-400 border-red-500/20' },
  };
  return tipos[tipo] || { texto: t('action'), cor: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
};

export function AtividadesRecentes() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const dateLocale = locale === 'pt' ? ptBR : enUS;

  const atividadesList = useLiveQuery(async () => {
    const hoje = new Date();
    const inicioDia = new Date(hoje.setHours(0, 0, 0, 0));
    const fimDia = new Date(hoje.setHours(23, 59, 59, 999));

    return await db.atividades
      .where('createdAt')
      .between(inicioDia, fimDia)
      .reverse()
      .toArray();
  }, []);

  const loading = atividadesList === undefined;
  const atividades = atividadesList || [];

  if (loading) {
    return (
      <Card className="lg:col-span-2 flex flex-col h-full">
        <CardHeader className="flex-shrink-0 border-b border-zinc-800/50 py-4 px-6">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            {t('recentActivities')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500/50"></div>
        </CardContent>
      </Card>
    );
  }

  if (atividades.length === 0) {
    return (
      <Card className="lg:col-span-2 flex flex-col h-full">
        <CardHeader className="flex-shrink-0 border-b border-zinc-800/50 py-4 px-6">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            {t('recentActivities')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-12">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-zinc-800" />
          </div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-100 mb-2">{t('noActivityToday')}</p>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed max-w-[240px]">
            {t('startCreatingAppointments')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2 flex flex-col h-full">
      <CardHeader className="flex-shrink-0 border-b border-zinc-800/50 py-4 px-6">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          {t('recentActivities')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-6 pt-6">
        <div className="h-full overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800">
          {atividades.map((atividade) => {
            const IconeComponent = getIcone(atividade.icone);
            const tipoInfo = getTipoTexto(atividade.tipo, t);

            return (
              <div
                key={atividade.id}
                className="group flex items-center gap-5 p-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 hover:bg-zinc-800/40 hover:border-zinc-700/50 transition-all cursor-pointer shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-950/50 flex items-center justify-center flex-shrink-0 border border-zinc-800/50">
                  <IconeComponent
                    className="w-5 h-5"
                    style={{ color: atividade.cor }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-black text-sm text-zinc-100 truncate group-hover:text-emerald-500 transition-colors uppercase tracking-tight">
                      {atividade.titulo}
                    </h4>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${tipoInfo.cor.split(' ').slice(1).join(' ')}`}>
                      {tipoInfo.texto}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-zinc-800" />
                      <span>
                        {formatDistanceToNow(new Date(atividade.createdAt), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </span>
                    </div>
                    {atividade.descricao && (
                      <span className="truncate opacity-40">— {atividade.descricao}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}