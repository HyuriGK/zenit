'use client';

import { useRef, useState } from 'react';
import { useSession } from '@/lib/auth-mock';
import { useTranslations } from 'next-intl';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ArrowUp, Bot, CalendarDays, ChartNoAxesCombined, ListTodo, Mic, MicOff, Paperclip, Pause, PhoneOff, Play, Sparkles } from 'lucide-react';

type Mensagem = { id: number; papel: 'assistente' | 'usuario'; texto: string };

const sugestoes = [
  { titulo: 'Minha semana', descricao: 'Veja prioridades e ritmo', texto: 'Como está minha semana?', icone: CalendarDays },
  { titulo: 'Minhas finanças', descricao: 'Entenda seus registros', texto: 'Resuma minhas finanças', icone: ChartNoAxesCombined },
  { titulo: 'Plano de hoje', descricao: 'Defina seu próximo passo', texto: 'O que preciso fazer hoje?', icone: ListTodo },
];

function RespostaFormatada({ texto }: { texto: string }) {
  const destacar = (trecho: string) => trecho.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g).map((parte, index) => {
    if (parte.startsWith('**') && parte.endsWith('**')) {
      return <strong key={index} className="font-semibold text-zinc-100">{parte.slice(2, -2)}</strong>;
    }

    if (parte.startsWith('*') && parte.endsWith('*')) {
      return <em key={index} className="text-zinc-200">{parte.slice(1, -1)}</em>;
    }

    return parte;
  });

  return <div className="space-y-2">{texto.split('\n').filter(Boolean).map((linha, index) => {
    const item = linha.replace(/^-\s*/, '');
    return linha.startsWith('- ') ? <div key={index} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" /><span>{destacar(item)}</span></div> : <p key={index}>{destacar(linha)}</p>;
  })}</div>;
}

export default function DashboardPage() {
  const tCommon = useTranslations('common');
  const { data: session, status } = useSession();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState('');
  const [gravando, setGravando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [chamadaAtiva, setChamadaAtiva] = useState(false);
  const [falaPausada, setFalaPausada] = useState(false);
  const [microfoneMutado, setMicrofoneMutado] = useState(false);
  const [estadoChamada, setEstadoChamada] = useState<'ouvindo' | 'pensando' | 'falando'>('ouvindo');
  const reconhecimentoRef = useRef<any>(null);
  const interrupcaoRef = useRef<any>(null);
  const chamadaAtivaRef = useRef(false);
  const aguardandoRespostaRef = useRef(false);
  const microfoneMutadoRef = useRef(false);
  const requisicaoRef = useRef<AbortController | null>(null);

  if (status === 'loading') return <LoadingScreen message={tCommon('loading')} />;
  if (!session) return null;

  const firstName = session.user.name?.split(' ')[0] || 'Usuário';
  const falarResposta = (resposta: string, retomarChamada = false) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(resposta.replace(/\*+/g, ''));
    fala.lang = 'pt-BR';
    fala.rate = 1;
    if (retomarChamada) {
      setEstadoChamada('falando');
      fala.onstart = () => { if (!microfoneMutadoRef.current) iniciarEscutaParaInterromper(); };
      fala.onend = () => {
        interrupcaoRef.current?.stop();
        interrupcaoRef.current = null;
        if (chamadaAtivaRef.current) {
          if (!aguardandoRespostaRef.current) iniciarEscuta();
          aguardandoRespostaRef.current = false;
        }
      };
    }
    window.speechSynthesis.speak(fala);
  };

  const enviarMensagem = async (conteudo = texto, responderEmVoz = false) => {
    const mensagem = conteudo.trim();
    if (!mensagem || enviando) return;

    const novaMensagem = { id: Date.now(), papel: 'usuario' as const, texto: mensagem };
    const proximoHistorico = [...mensagens, novaMensagem];
    setMensagens(proximoHistorico);
    setTexto('');
    requisicaoRef.current?.abort();
    const requisicao = new AbortController();
    requisicaoRef.current = requisicao;
    setEnviando(true);
    try {
      const response = await fetch('/api/assistente', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: requisicao.signal,
        body: JSON.stringify({ mensagens: proximoHistorico.map(({ papel, texto }) => ({ papel, texto })) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível responder agora.');
      if (requisicao.signal.aborted) return;
      setMensagens((atual) => [...atual, { id: Date.now() + 1, papel: 'assistente', texto: data.resposta }]);
      if (responderEmVoz) falarResposta(data.resposta, chamadaAtivaRef.current);
    } catch (error) {
      if (requisicao.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return;
      setMensagens((atual) => [...atual, { id: Date.now() + 1, papel: 'assistente', texto: error instanceof Error ? error.message : 'Não foi possível responder agora.' }]);
    } finally {
      if (requisicaoRef.current === requisicao) {
        requisicaoRef.current = null;
        setEnviando(false);
      }
    }
  };

  const iniciarEscuta = () => {
    if (!chamadaAtivaRef.current || microfoneMutadoRef.current || enviando || reconhecimentoRef.current) return;
    const navegadorComVoz = window as Window & { SpeechRecognition?: any; webkitSpeechRecognition?: any };
    const Reconhecimento = navegadorComVoz.SpeechRecognition || navegadorComVoz.webkitSpeechRecognition;
    if (!Reconhecimento) return;
    const reconhecimento = new Reconhecimento();
    reconhecimento.lang = 'pt-BR';
    reconhecimento.continuous = false;
    reconhecimento.interimResults = false;
    reconhecimento.onresult = (event: any) => {
      const transcricao = event.results[0]?.[0]?.transcript?.trim();
      if (transcricao) {
        aguardandoRespostaRef.current = true;
        setEstadoChamada('pensando');
        enviarMensagem(transcricao, true);
      }
    };
    reconhecimento.onerror = () => { reconhecimentoRef.current = null; setGravando(false); };
    reconhecimento.onend = () => {
      reconhecimentoRef.current = null;
      setGravando(false);
      if (chamadaAtivaRef.current && !aguardandoRespostaRef.current) setTimeout(iniciarEscuta, 250);
    };
    reconhecimentoRef.current = reconhecimento;
    setGravando(true);
    setEstadoChamada('ouvindo');
    reconhecimento.start();
  };

  const iniciarEscutaParaInterromper = () => {
    if (!chamadaAtivaRef.current || microfoneMutadoRef.current || interrupcaoRef.current) return;
    const navegadorComVoz = window as Window & { SpeechRecognition?: any; webkitSpeechRecognition?: any };
    const Reconhecimento = navegadorComVoz.SpeechRecognition || navegadorComVoz.webkitSpeechRecognition;
    if (!Reconhecimento) return;
    const interrupcao = new Reconhecimento();
    interrupcao.lang = 'pt-BR';
    interrupcao.continuous = false;
    interrupcao.interimResults = false;
    interrupcao.onresult = (event: any) => {
      const transcricao = event.results[0]?.[0]?.transcript?.trim();
      if (!transcricao || !chamadaAtivaRef.current) return;
      aguardandoRespostaRef.current = true;
      window.speechSynthesis.cancel();
      interrupcaoRef.current = null;
      setEstadoChamada('pensando');
      enviarMensagem(transcricao, true);
    };
    interrupcao.onerror = () => { interrupcaoRef.current = null; };
    interrupcao.onend = () => { interrupcaoRef.current = null; };
    interrupcaoRef.current = interrupcao;
    interrupcao.start();
  };

  const iniciarChamada = () => {
    const navegadorComVoz = window as Window & { SpeechRecognition?: any; webkitSpeechRecognition?: any };
    if (!(navegadorComVoz.SpeechRecognition || navegadorComVoz.webkitSpeechRecognition)) {
      setMensagens((atual) => [...atual, { id: Date.now(), papel: 'assistente', texto: 'A chamada por voz requer Chrome ou Edge com acesso ao microfone.' }]);
      return;
    }
    chamadaAtivaRef.current = true;
    setChamadaAtiva(true);
    setFalaPausada(false);
    setMicrofoneMutado(false);
    microfoneMutadoRef.current = false;
    iniciarEscuta();
  };

  const encerrarChamada = () => {
    chamadaAtivaRef.current = false;
    aguardandoRespostaRef.current = false;
    reconhecimentoRef.current?.stop();
    reconhecimentoRef.current = null;
    interrupcaoRef.current?.stop();
    interrupcaoRef.current = null;
    requisicaoRef.current?.abort();
    requisicaoRef.current = null;
    window.speechSynthesis?.cancel();
    setGravando(false);
    setEnviando(false);
    setChamadaAtiva(false);
    setFalaPausada(false);
    setMicrofoneMutado(false);
    microfoneMutadoRef.current = false;
  };

  const alternarMicrofone = () => {
    const novoEstado = !microfoneMutadoRef.current;
    microfoneMutadoRef.current = novoEstado;
    setMicrofoneMutado(novoEstado);
    if (novoEstado) {
      reconhecimentoRef.current?.stop();
      reconhecimentoRef.current = null;
      interrupcaoRef.current?.stop();
      interrupcaoRef.current = null;
      setGravando(false);
      return;
    }
    if (estadoChamada === 'falando' && !falaPausada) iniciarEscutaParaInterromper();
    else iniciarEscuta();
  };

  const alternarPausaFala = () => {
    if (!window.speechSynthesis) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setFalaPausada(false);
    } else {
      window.speechSynthesis.pause();
      setFalaPausada(true);
    }
  };

  const alternarVoz = () => {
    if (!gravando && !chamadaAtivaRef.current) {
      iniciarChamada();
      return;
    }
    if (gravando) {
      reconhecimentoRef.current?.stop();
      return;
    }

    const navegadorComVoz = window as Window & { SpeechRecognition?: any; webkitSpeechRecognition?: any };
    const Reconhecimento = navegadorComVoz.SpeechRecognition || navegadorComVoz.webkitSpeechRecognition;
    if (!Reconhecimento) {
      setMensagens((atual) => [...atual, { id: Date.now(), papel: 'assistente', texto: 'A captura de voz não é compatível com este navegador. Use o Chrome ou Edge para falar comigo.' }]);
      return;
    }

    const reconhecimento = new Reconhecimento();
    reconhecimento.lang = 'pt-BR';
    reconhecimento.continuous = false;
    reconhecimento.interimResults = false;
    reconhecimento.onresult = (event: any) => {
      const transcricao = event.results[0]?.[0]?.transcript?.trim();
      if (transcricao) enviarMensagem(transcricao, true);
    };
    reconhecimento.onerror = () => {
      setGravando(false);
      reconhecimentoRef.current = null;
    };
    reconhecimento.onend = () => {
      setGravando(false);
      reconhecimentoRef.current = null;
    };
    reconhecimentoRef.current = reconhecimento;
    setGravando(true);
    reconhecimento.start();
  };

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-zinc-950 px-4 py-4 sm:px-6 lg:px-10 lg:py-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.13),transparent_64%)]" />
      <div className="relative mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
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
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pb-8 pt-2">
            <div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200"><Bot className="h-5 w-5" /></div><div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm leading-relaxed text-zinc-300">Estou pronto para ajudar com sua rotina, metas e registros.</div></div>
            {mensagens.map((mensagem) => mensagem.papel === 'usuario' ? <div key={mensagem.id} className="flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-cyan-500 to-blue-600 px-4 py-3 text-sm leading-relaxed text-white shadow-lg shadow-cyan-950/30">{mensagem.texto}</div></div> : <div key={mensagem.id} className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200"><Bot className="h-5 w-5" /></div><div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm leading-relaxed text-zinc-300"><RespostaFormatada texto={mensagem.texto} /></div></div>)}
            {enviando && <div className="flex items-center gap-3 text-sm text-zinc-500"><Bot className="h-5 w-5 animate-pulse text-cyan-300" />Azimov está pensando...</div>}
          </div>
        )}
        <div className="sticky bottom-0 w-full pt-6"><div className="rounded-[26px] border border-zinc-700/80 bg-zinc-900/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl"><textarea value={texto} onChange={(event) => setTexto(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); enviarMensagem(); } }} rows={1} placeholder="Pergunte sobre sua vida, rotina ou finanças..." className="max-h-36 min-h-12 w-full resize-none bg-transparent px-3 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none" /><div className="flex items-center justify-between gap-2 px-1 pb-1"><div className="flex items-center gap-1"><button type="button" aria-label="Anexar contexto" className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"><Paperclip className="h-4 w-4" /></button><button type="button" aria-label={gravando ? 'Parar de ouvir' : 'Conversar por voz'} onClick={alternarVoz} className={`flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-bold transition-colors ${gravando ? 'bg-red-500/15 text-red-300' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}><Mic className={`h-4 w-4 ${gravando ? 'animate-pulse' : ''}`} /><span className="hidden sm:inline">{gravando ? 'Ouvindo...' : 'Voz'}</span></button></div><button type="button" aria-label="Enviar mensagem" onClick={() => enviarMensagem()} disabled={!texto.trim() || enviando} className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-zinc-950 transition-all hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600"><ArrowUp className="h-5 w-5" /></button></div></div><p className="mt-3 text-center text-[10px] text-zinc-600">O assistente poderá usar seus dados somente quando você autorizar.</p></div>
      </div>

      {chamadaAtiva && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/90 px-4 backdrop-blur-xl">
          <div className="relative flex w-full max-w-lg flex-col items-center overflow-hidden rounded-[40px] border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(24,24,27,0.98),rgba(9,9,11,0.96))] px-6 py-8 text-center shadow-2xl shadow-cyan-950/50 sm:px-12 sm:py-11">
            <div className="pointer-events-none absolute -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-12 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" />
            <span className="relative text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200">Chamada com Azimov</span>
            <div className="relative my-8 flex h-56 w-56 items-center justify-center">
              <div className={`absolute inset-0 rounded-full bg-cyan-400/10 blur-xl transition-all duration-500 ${estadoChamada === 'falando' ? 'scale-125 animate-pulse' : estadoChamada === 'ouvindo' ? 'scale-110 animate-pulse' : 'scale-95'}`} />
              <div className={`absolute inset-5 rounded-full border border-cyan-300/20 transition-all duration-500 ${estadoChamada === 'falando' ? 'scale-110' : ''}`} />
              <div className={`absolute inset-10 rounded-full bg-gradient-to-br from-cyan-300 via-sky-500 to-blue-700 shadow-[0_0_60px_rgba(34,211,238,0.45)] transition-all duration-500 ${estadoChamada === 'pensando' ? 'animate-pulse' : ''}`} />
              <Bot className="relative h-12 w-12 text-white" />
            </div>
            <h2 className="relative text-2xl font-black text-white">{estadoChamada === 'ouvindo' ? 'Estou ouvindo' : estadoChamada === 'pensando' ? 'Pensando na resposta' : falaPausada ? 'Fala pausada' : 'Azimov está falando'}</h2>
            <p className="relative mt-3 max-w-xs text-sm leading-6 text-zinc-400">{estadoChamada === 'ouvindo' ? 'Fale naturalmente. O Azimov pausa para escutar você.' : estadoChamada === 'pensando' ? 'Organizando uma resposta com seus dados.' : 'Você pode pausar a resposta ou falar para interromper.'}</p>
            <div className="relative mt-4 flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/55 px-3 py-2 text-xs text-zinc-400">
              {microfoneMutado ? <MicOff className="h-4 w-4 text-amber-300" /> : <Mic className="h-4 w-4 text-cyan-300" />}
              {microfoneMutado ? 'Microfone mutado: sua fala não interrompe o Azimov.' : 'Microfone ativo: fale para interromper e responder.'}
            </div>
            <div className="relative mt-7 flex items-center gap-3">
              <button type="button" onClick={alternarMicrofone} aria-label={microfoneMutado ? 'Ativar microfone' : 'Mutar microfone'} className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors ${microfoneMutado ? 'border-amber-300/30 bg-amber-400/10 text-amber-200' : 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'}`}>{microfoneMutado ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}</button>
              <button type="button" onClick={alternarPausaFala} aria-label={falaPausada ? 'Continuar fala' : 'Pausar fala'} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-200 transition-colors hover:bg-zinc-700">{falaPausada ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}</button>
              <button type="button" onClick={encerrarChamada} className="flex h-12 items-center gap-2 rounded-2xl bg-red-500 px-5 text-sm font-bold text-white transition-colors hover:bg-red-400"><PhoneOff className="h-5 w-5" /> Encerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
