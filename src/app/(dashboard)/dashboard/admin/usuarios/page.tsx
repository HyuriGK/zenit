'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-mock';
import { isAdminEmail } from '@/lib/admin';
import { Laptop, RefreshCw, Search, ShieldCheck, Users } from 'lucide-react';

type Usuario = { id: string; name: string | null; email: string | null; role: string; plano: string; createdAt: string; logsAcesso: { createdAt: string; dispositivo: string | null }[] };
const data = (valor?: string) => valor ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor)) : '—';

export default function UsuariosAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const carregar = useCallback(async () => { setLoading(true); const resposta = await fetch('/api/admin/usuarios', { cache: 'no-store' }); if (resposta.status === 403) return router.replace('/dashboard'); if (resposta.ok) setUsuarios(await resposta.json()); setLoading(false); }, [router]);
  useEffect(() => { if (status === 'authenticated' && !isAdminEmail(session?.user?.email)) router.replace('/dashboard'); }, [router, session?.user?.email, status]);
  useEffect(() => { if (status === 'authenticated' && isAdminEmail(session?.user?.email)) void carregar(); }, [carregar, session?.user?.email, status]);
  if (status === 'loading' || !isAdminEmail(session?.user?.email)) return null;
  const filtrados = usuarios.filter((usuario) => `${usuario.name} ${usuario.email} ${usuario.role}`.toLowerCase().includes(busca.toLowerCase()));
  return <main className="min-h-full bg-zinc-950 px-4 py-7 sm:px-7 lg:px-10"><div className="mx-auto max-w-[1500px]"><header className="flex items-center gap-4 border-b border-zinc-800 pb-6"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-500/10 text-blue-300"><Users className="h-5 w-5" /></div><div><h1 className="text-xl font-bold text-white">Usuários</h1><p className="text-sm text-zinc-500">Contas cadastradas e última atividade</p></div></header><section className="pt-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="relative w-full max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar usuário..." className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-10 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none" /></div><button onClick={() => void carregar()} className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Atualizar</button></div><div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-zinc-800 bg-zinc-900/70 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500"><tr><th className="px-5 py-4">Usuário</th><th className="px-5 py-4">E-mail</th><th className="px-5 py-4">Role atual</th><th className="px-5 py-4">Plano</th><th className="px-5 py-4">Última atividade</th><th className="px-5 py-4">Dispositivo</th></tr></thead><tbody className="divide-y divide-zinc-800/80">{filtrados.map((usuario) => <tr key={usuario.id} className="hover:bg-zinc-900/50"><td className="px-5 py-4 font-semibold text-zinc-100">{usuario.name || 'Sem nome'}</td><td className="px-5 py-4 text-zinc-400">{usuario.email || '—'}</td><td className="px-5 py-4"><span className={`rounded-md border px-2 py-1 text-xs font-bold ${usuario.role === 'ADMIN' ? 'border-violet-400/30 bg-violet-400/10 text-violet-200' : 'border-zinc-700 text-zinc-300'}`}>{usuario.role}</span></td><td className="px-5 py-4 text-zinc-400">{usuario.plano}</td><td className="px-5 py-4 text-zinc-400">{data(usuario.logsAcesso[0]?.createdAt)}</td><td className="px-5 py-4">{usuario.logsAcesso[0]?.dispositivo ? <span className="inline-flex items-center gap-1 text-emerald-300"><Laptop className="h-3.5 w-3.5" />{usuario.logsAcesso[0].dispositivo}</span> : '—'}</td></tr>)}{!loading && !filtrados.length && <tr><td colSpan={6} className="px-5 py-16 text-center text-zinc-500"><ShieldCheck className="mx-auto mb-3 h-6 w-6" />Nenhum usuário encontrado.</td></tr>}</tbody></table></div></div></section></div></main>;
}
