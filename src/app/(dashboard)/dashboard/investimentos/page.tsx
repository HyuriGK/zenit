'use client';

import { useTranslations } from 'next-intl';
import MarketOverview from '@/components/investimentos/MarketOverview';
import PersonalPortfolio from '@/components/investimentos/PersonalPortfolio';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useState, useEffect } from 'react';

export default function InvestimentosPage() {
    const t = useTranslations('investments');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simular carregamento inicial
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return <LoadingScreen message="Carregando seus investimentos..." />;
    }

    return (
        <div className="flex flex-col h-full overflow-hidden p-4 lg:p-6 space-y-6">
            <PageHeader 
                title={t('title')}
                description={t('subtitle') || 'Acompanhe seus investimentos e o mercado'}
            />
            <div className="flex-1 overflow-y-auto min-h-0 space-y-6 sm:space-y-8 pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900 pb-10">

                {/* Visão de Mercado (Layout Estático / Gráficos) */}
                <section>
                    <MarketOverview />
                </section>

                {/* Gerenciamento de Carteira Pessoal */}
                <section>
                    <PersonalPortfolio />
                </section>

            </div>
        </div>
    );
}
