'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/auth-mock';
import { isAdminEmail } from '@/lib/admin';
import { AlertCircle, FileClock, Laptop, RefreshCw, ShieldCheck, Ticket, Users } from 'lucide-react';

type Log = {
  id: string;
  rota: string;
  acao: string;
  dispositivo: string | null;
  detalhes: string | null;
  createdAt: string;
  user: { name: string | null; email: string | null; role: string };
};

function nomeDaTela(rota: string) {
  if (rota === '/dashboard') return 'Dashboard';
  return rota.replace('/dashboard/', '').split('/').map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1)).join(' › ');
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarLogs = useCallback(async () => {
    setLoading(true);
    const response = await fetch('/api/admin/logs', { cache: 'no-store' });
    if (response.status === 403) {
      router.replace('/dashboard');
      return;
    }
    if (response.ok) setLogs(await response.json());
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (status === 'authenticated' && !isAdminEmail(session?.user?.email)) router.replace('/dashboard');
  }, [router, session?.user?.email, status]);

  useEffect(() => {
    if (status === 'authenticated' && isAdminEmail(session?.user?.email)) void carregarLogs();
  }, [carregarLogs, session?.user?.email, status]);

  if (status === 'loading' || !isAdminEmail(session?.user?.email)) return null;

  return (
    <main className="min-h-full bg-zinc-950 px-4 py-7 sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex items-center gap-4 border-b border-zinc-800 pb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/10 text-violet-300"><Ticket className="h-5 w-5" /></div>
          <div><h1 className="text-xl font-bold text-white">Painel administrativo</h1><p className="text-sm text-zinc-500">Acompanhamento de acessos ao sistema</p></div>
        </header>

        <section className="pt-6">
          <div className="mb-7 grid gap-4 md:grid-cols-2">
            <Link href="/dashboard/admin/usuarios" className="group rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 transition-colors hover:border-blue-400/35 hover:bg-zinc-900/60">
              <div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/10 text-blue-300"><Users className="h-5 w-5" /></div><div><h2 className="font-bold text-white">Usuários</h2><p className="mt-1 text-sm text-zinc-500">Consulte contas, roles e a última atividade.</p></div></div>
            </Link>
            <a href="#logs" className="group rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 transition-colors hover:border-emerald-400/35 hover:bg-zinc-900/60">
              <div className="flex items-center gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/10 text-emerald-300"><FileClock className="h-5 w-5" /></div><div><h2 className="font-bold text-white">Logs do sistema</h2><p className="mt-1 text-sm text-zinc-500">Audite acessos de todos os usuários.</p></div></div>
            </a>
          </div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div id="logs" className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-400"><ShieldCheck className="h-4 w-4 text-amber-400" /> Logs do sistema</div>
            <button type="button" onClick={() => void carregarLogs()} className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-800"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Atualizar</button>
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-900/70 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500"><tr><th className="px-5 py-4">Data/hora</th><th className="px-5 py-4">Usuário</th><th className="px-5 py-4">Dispositivo</th><th className="px-5 py-4">Ação</th><th className="px-5 py-4">Tela</th><th className="px-5 py-4">Detalhes</th></tr></thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {logs.map((log) => <tr key={log.id} className="text-zinc-300 hover:bg-zinc-900/50"><td className="whitespace-nowrap px-5 py-4 text-xs text-zinc-400">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(log.createdAt))}</td><td className="px-5 py-4"><p className="font-semibold text-amber-300">{log.user.name || 'Sem nome'}</p><p className="mt-0.5 text-xs text-zinc-600">{log.user.email}</p></td><td className="px-5 py-4">{log.dispositivo ? <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-xs font-semibold text-emerald-300"><Laptop className="h-3 w-3" />{log.dispositivo}</span> : '—'}</td><td className="px-5 py-4 font-semibold text-cyan-300">Acessou tela</td><td className="px-5 py-4">{nomeDaTela(log.rota)}</td><td className="px-5 py-4 text-zinc-400">{log.detalhes || '—'}</td></tr>)}
                  {!loading && logs.length === 0 && <tr><td colSpan={6} className="px-5 py-16 text-center text-zinc-500"><AlertCircle className="mx-auto mb-3 h-6 w-6" />Ainda não há acessos registrados.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
