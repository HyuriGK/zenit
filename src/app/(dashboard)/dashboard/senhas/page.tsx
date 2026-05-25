'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useState, useEffect } from 'react';
import GestaoSenhas from '@/components/senhas/GestaoSenhas';
import { Shield } from 'lucide-react';

export default function SenhasPage() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 600);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return <LoadingScreen message="Carregando seu cofre de senhas..." />;
    }

    return (
        <div className="flex flex-col h-full overflow-hidden p-4 lg:p-6 space-y-6">
            <PageHeader
                title="Gestão de Senhas"
                description="Armazene e acesse suas senhas com segurança. Nunca mais esqueça um login."
                action={
                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Criptografado</span>
                    </div>
                }
            />
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900 pb-10">
                <GestaoSenhas />
            </div>
        </div>
    );
}
