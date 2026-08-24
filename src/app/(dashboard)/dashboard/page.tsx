'use client';

import { useState } from 'react';
import { useSession } from '@/lib/auth-mock';
import { useTranslations } from 'next-intl';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ArrowUp, Bot, CalendarDays, ChartNoAxesCombined, ListTodo, Mic, Paperclip, Sparkles } from 'lucide-react';

type Mensagem = { id: number; papel: 'assistente' | 'usuario'; texto: string };

const sugestoes = [
  { titulo: 'Minha semana', descricao: 'Veja prioridades e ritmo', texto: 'Como está minha semana?', icone: CalendarDays },
  { titulo: 'Minhas finanças', descricao: 'Entenda seus registros', texto: 'Resuma minhas finanças', icone: ChartNoAxesCombined },
  { titulo: 'Plano de hoje', descricao: 'Defina seu próximo passo', texto: 'O que preciso fazer hoje?', icone: ListTodo },
];

export default function DashboardPage() {
  const tCommon = useTranslations('common');
  const { data: session, status } = useSession();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState('');
  const [gravando, setGravando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  if (status === 'loading') return <LoadingScreen message={tCommon('loading')} />;
  if (!session) return null;

  const firstName = session.user.name?.split(' ')[0] || 'Usuário';
  const enviarMensagem = async (conteudo = texto) => {
    const mensagem = conteudo.trim();
    if (!mensagem || enviando) return;

    const novaMensagem = { id: Date.now(), papel: 'usuario' as const, texto: mensagem };
    const proximoHistorico = [...mensagens, novaMensagem];
    setMensagens(proximoHistorico);
    setTexto('');
    setEnviando(true);
    try {
      const response = await fetch('/api/assistente', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensagens: proximoHistorico.map(({ papel, texto }) => ({ papel, texto })) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível responder agora.');
      setMensagens((atual) => [...atual, { id: Date.now() + 1, papel: 'assistente', texto: data.resposta }]);
    } catch (error) {
      setMensagens((atual) => [...atual, { id: Date.now() + 1, papel: 'assistente', texto: error instanceof Error ? error.message : 'Não foi possível responder agora.' }]);
    } finally { setEnviando(false); }
  };

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-zinc-950 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.13),transparent_64%)]" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col">
        {mensagens.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-8 sm:py-12">
            <section className="w-full overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-900/35 shadow-2xl shadow-black/20 backdrop-blur-sm">
              <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
                <div className="relative p-6 sm:p-9 lg:p-11">
                  <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
                  <div className="relative">
                    <div className="mb-7 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200 shadow-[0_0_35px_rgba(34,211,238,0.13)]"><Bot className="h-6 w-6" /></div>
                      <div><span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200"><Sparkles className="h-3.5 w-3.5" /> Assistente Azimov</span><span className="mt-1 block text-xs text-zinc-500">Pronto para conversar</span></div>
                    </div>
                    <h1 className="max-w-xl text-3xl font-black tracking-tight text-white sm:text-4xl">Seu espaço para pensar, organizar e avançar.</h1>
                    <p className="mt-4 max-w-lg text-sm leading-7 text-zinc-400">Olá, {firstName}. Use o Azimov para transformar seus registros em decisões mais claras para o dia a dia.</p>
                    <div className="mt-7 flex items-center gap-2 text-xs text-zinc-500"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Assistente disponível</div>
                  </div>
                </div>
                <div className="border-t border-zinc-800 bg-zinc-950/45 p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8">
                  <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Comece por aqui</p>
                  <div className="space-y-2.5">
                    {sugestoes.map((sugestao) => {
                      const Icone = sugestao.icone;
                      return <button key={sugestao.titulo} type="button" onClick={() => enviarMensagem(sugestao.texto)} className="group flex w-full items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5 text-left transition-all hover:border-cyan-400/30 hover:bg-zinc-900"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 transition-colors group-hover:bg-cyan-400/10 group-hover:text-cyan-200"><Icone className="h-4 w-4" /></div><div className="min-w-0"><span className="block text-sm font-semibold text-zinc-200 group-hover:text-white">{sugestao.titulo}</span><span className="block truncate text-xs text-zinc-500">{sugestao.descricao}</span></div></button>;
                    })}
                  </div>
                  <p className="mt-5 text-xs leading-5 text-zinc-600">Você decide quando o assistente poderá considerar dados dos seus módulos.</p>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="flex-1 space-y-6 overflow-y-auto pb-8 pt-2">
            <div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200"><Bot className="h-5 w-5" /></div><div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm leading-relaxed text-zinc-300">Estou pronto para ajudar com sua rotina, metas e registros.</div></div>
            {mensagens.map((mensagem) => mensagem.papel === 'usuario' ? <div key={mensagem.id} className="flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-cyan-500 to-blue-600 px-4 py-3 text-sm leading-relaxed text-white shadow-lg shadow-cyan-950/30">{mensagem.texto}</div></div> : <div key={mensagem.id} className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200"><Bot className="h-5 w-5" /></div><div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm leading-relaxed text-zinc-300">{mensagem.texto}</div></div>)}
            {enviando && <div className="flex items-center gap-3 text-sm text-zinc-500"><Bot className="h-5 w-5 animate-pulse text-cyan-300" />Azimov está pensando...</div>}
          </div>
        )}
        <div className="sticky bottom-0 w-full pt-4"><div className="rounded-[26px] border border-zinc-700/80 bg-zinc-900/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl"><textarea value={texto} onChange={(event) => setTexto(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); enviarMensagem(); } }} rows={1} placeholder="Pergunte sobre sua vida, rotina ou finanças..." className="max-h-36 min-h-12 w-full resize-none bg-transparent px-3 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none" /><div className="flex items-center justify-between gap-2 px-1 pb-1"><div className="flex items-center gap-1"><button type="button" aria-label="Anexar contexto" className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"><Paperclip className="h-4 w-4" /></button><button type="button" aria-label="Conversar por voz" onClick={() => setGravando((atual) => !atual)} className={`flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-bold transition-colors ${gravando ? 'bg-red-500/15 text-red-300' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}><Mic className={`h-4 w-4 ${gravando ? 'animate-pulse' : ''}`} /><span className="hidden sm:inline">{gravando ? 'Ouvindo...' : 'Voz'}</span></button></div><button type="button" aria-label="Enviar mensagem" onClick={() => enviarMensagem()} disabled={!texto.trim() || enviando} className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-zinc-950 transition-all hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600"><ArrowUp className="h-5 w-5" /></button></div></div><p className="mt-3 text-center text-[10px] text-zinc-600">O assistente poderá usar seus dados somente quando você autorizar.</p></div>
      </div>
    </div>
  );
}
