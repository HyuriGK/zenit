'use client';

import { useState } from 'react';
import { db } from '@/lib/dexie';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Loader2, Database, ArrowLeft, CloudUpload } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Stats {
    contas: number;
    cartoes: number;
    categorias: number;
    transacoes: number;
    objetivos: number;
    erros: number;
}

type Status = 'idle' | 'reading' | 'sending' | 'done' | 'error';

export default function MigrarFinanceiroPage() {
    const [status, setStatus] = useState<Status>('idle');
    const [preview, setPreview] = useState<{ contas: number; cartoes: number; categorias: number; transacoes: number; objetivos: number } | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [erro, setErro] = useState<string | null>(null);

    const lerDexie = async () => {
        setStatus('reading');
        try {
            const [contas, cartoes, categorias, transacoes, objetivos] = await Promise.all([
                db.contasBancarias.toArray(),
                db.cartoes.toArray(),
                db.categorias.toArray(),
                db.transacoes.toArray(),
                db.objetivosFinanceiros.toArray(),
            ]);
            setPreview({ contas: contas.length, cartoes: cartoes.length, categorias: categorias.length, transacoes: transacoes.length, objetivos: objetivos.length });
            setStatus('idle');
            return { contas, cartoes, categorias, transacoes, objetivos };
        } catch (e) {
            setErro('Erro ao ler dados do navegador: ' + (e as Error).message);
            setStatus('error');
            return null;
        }
    };

    const migrar = async () => {
        setStatus('reading');
        setErro(null);
        const dados = await lerDexie();
        if (!dados) return;

        setStatus('sending');
        const t = toast.loading('Enviando dados para o servidor...');
        try {
            const res = await fetch('/api/financeiro/migrar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados),
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.error || 'Erro desconhecido');
            setStats(json.stats);
            setStatus('done');
            toast.success('Migração concluída com sucesso!', { id: t });
        } catch (e) {
            setErro((e as Error).message);
            setStatus('error');
            toast.error('Falha na migração.', { id: t });
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 p-4 lg:p-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard/financeiro" className="text-zinc-500 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-white">Migrar para Nuvem</h1>
                        <p className="text-zinc-500 text-sm mt-0.5">Transfere seus dados financeiros do navegador para o servidor</p>
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 mb-6">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 flex-shrink-0">
                            <Database className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="font-bold text-white">O que será migrado</h2>
                            <p className="text-zinc-500 text-sm mt-1">Todos os dados abaixo serão copiados do seu navegador para o servidor Neon. Os dados locais <strong className="text-white">não serão apagados</strong> — a migração é não-destrutiva.</p>
                        </div>
                    </div>

                    {preview ? (
                        <div className="grid grid-cols-3 gap-3 mt-4">
                            {[
                                { label: 'Contas', value: preview.contas, color: 'text-emerald-400' },
                                { label: 'Cartões', value: preview.cartoes, color: 'text-blue-400' },
                                { label: 'Categorias', value: preview.categorias, color: 'text-purple-400' },
                                { label: 'Transações', value: preview.transacoes, color: 'text-yellow-400' },
                                { label: 'Metas', value: preview.objetivos, color: 'text-pink-400' },
                            ].map(item => (
                                <div key={item.label} className="bg-zinc-800/40 rounded-xl p-3 text-center">
                                    <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
                                    <div className="text-zinc-500 text-xs font-medium mt-0.5">{item.label}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-600 text-sm mt-4">Clique em "Verificar dados" para ver o que será migrado.</p>
                    )}
                </div>

                {/* Status messages */}
                {status === 'done' && stats && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            <span className="font-bold text-emerald-400">Migração concluída!</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                            {Object.entries(stats).filter(([k]) => k !== 'erros').map(([key, val]) => (
                                <div key={key} className="text-zinc-400">
                                    <span className="font-bold text-white">{val}</span> {key}
                                </div>
                            ))}
                        </div>
                        {stats.erros > 0 && (
                            <p className="text-yellow-400 text-sm mt-3">{stats.erros} item(s) não puderam ser migrados (possivelmente já existem).</p>
                        )}
                        <Link href="/dashboard/financeiro">
                            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white w-full h-12 rounded-xl font-bold">
                                Ir para o Financeiro
                            </Button>
                        </Link>
                    </div>
                )}

                {status === 'error' && erro && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 mb-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-red-400">Erro na migração</p>
                            <p className="text-zinc-400 text-sm mt-1">{erro}</p>
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                {status !== 'done' && (
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={lerDexie}
                            disabled={status === 'reading' || status === 'sending'}
                            className="flex-1 border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white h-12 rounded-xl font-bold"
                        >
                            {status === 'reading' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Verificar dados
                        </Button>
                        <Button
                            onClick={migrar}
                            disabled={status === 'reading' || status === 'sending'}
                            className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white h-12 rounded-xl font-bold gap-2"
                        >
                            {status === 'sending'
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Migrando...</>
                                : <><CloudUpload className="w-4 h-4" /> Migrar para Nuvem</>
                            }
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
