'use client';

import { useState } from 'react';
import { useSession } from '@/lib/auth-mock';
import { useTranslations } from 'next-intl';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ArrowUp, Bot, Mic, Paperclip, Sparkles } from 'lucide-react';

type Mensagem = {
  id: number;
  papel: 'assistente' | 'usuario';
  texto: string;
};

const sugestoes = [
  'Como está minha semana?',
  'Resuma minhas finanças',
  'O que preciso fazer hoje?',
];

export default function DashboardPage() {
  const tCommon = useTranslations('common');
  const { data: session, status } = useSession();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState('');
  const [gravando, setGravando] = useState(false);

  if (status === 'loading') return <LoadingScreen message={tCommon('loading')} />;
  if (!session) return null;

  const firstName = session.user.name?.split(' ')[0] || 'Usuário';
  const enviarMensagem = (conteudo = texto) => {
    const mensagem = conteudo.trim();
    if (!mensagem) return;

    setMensagens((atual) => [...atual, { id: Date.now(), papel: 'usuario', texto: mensagem }]);
    setTexto('');
  };

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-zinc-950 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.12),transparent_68%)]" />

      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col">
        {mensagens.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center pb-14 text-center sm:pb-20">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/20 via-blue-500/15 to-violet-500/20 shadow-[0_0_70px_rgba(34,211,238,0.16)]">
              <Bot className="h-8 w-8 text-cyan-200" />
            </div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" /> Assistente Azimov
            </span>
            <h1 className="max-w-2xl text-3xl font-black tracking-tight text-white sm:text-5xl">
              Olá, {firstName}. Como posso ajudar?
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Converse sobre sua rotina, metas e registros. Em breve, você também poderá falar comigo por voz.
            </p>

            <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-3">
              {sugestoes.map((sugestao) => (
                <button
                  key={sugestao}
                  type="button"
                  onClick={() => enviarMensagem(sugestao)}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-left text-sm font-medium text-zinc-300 transition-colors hover:border-cyan-400/30 hover:bg-zinc-900 hover:text-white"
                >
                  {sugestao}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-6 overflow-y-auto pb-8 pt-2">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200"><Bot className="h-5 w-5" /></div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm leading-relaxed text-zinc-300">
                Estou pronto para analisar seus registros assim que o assistente estiver conectado.
              </div>
            </div>
            {mensagens.map((mensagem) => (
              <div key={mensagem.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-cyan-500 to-blue-600 px-4 py-3 text-sm leading-relaxed text-white shadow-lg shadow-cyan-950/30">
                  {mensagem.texto}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="sticky bottom-0 w-full pt-4">
          <div className="rounded-[26px] border border-zinc-700/80 bg-zinc-900/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <textarea
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  enviarMensagem();
                }
              }}
              rows={1}
              placeholder="Pergunte sobre sua vida, rotina ou finanças..."
              className="max-h-36 min-h-12 w-full resize-none bg-transparent px-3 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
            />
            <div className="flex items-center justify-between gap-2 px-1 pb-1">
              <div className="flex items-center gap-1">
                <button type="button" aria-label="Anexar contexto" className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"><Paperclip className="h-4 w-4" /></button>
                <button type="button" aria-label="Conversar por voz" onClick={() => setGravando((atual) => !atual)} className={`flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-bold transition-colors ${gravando ? 'bg-red-500/15 text-red-300' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                  <Mic className={`h-4 w-4 ${gravando ? 'animate-pulse' : ''}`} />
                  <span className="hidden sm:inline">{gravando ? 'Ouvindo...' : 'Voz'}</span>
                </button>
              </div>
              <button type="button" aria-label="Enviar mensagem" onClick={() => enviarMensagem()} disabled={!texto.trim()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-zinc-950 transition-all hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600">
                <ArrowUp className="h-5 w-5" />
              </button>
            </div>
          </div>
          <p className="mt-3 text-center text-[10px] text-zinc-600">O assistente poderá usar seus dados somente quando você autorizar.</p>
        </div>
      </div>
    </div>
  );
}
