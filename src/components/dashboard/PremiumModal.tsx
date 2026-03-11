'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { usePlano } from '@/hooks/usePlano';
import { useTranslations } from 'next-intl';

export function PremiumModal() {
    const [isOpen, setIsOpen] = useState(false);
    const { ehFree } = usePlano();
    const router = useRouter();
    const t = useTranslations('dashboard');

    useEffect(() => {
        // Apenas mostrar se o usuário for do plano Free
        if (ehFree) {
            // Verificar no sessionStorage se já foi exibido nesta sessão do navegador
            const hasShown = sessionStorage.getItem('zenit_premium_modal_shown');
            if (!hasShown) {
                // Pequeno atraso para a dashboard carregar antes de mostrar o popup
                const timer = setTimeout(() => {
                    setIsOpen(true);
                    sessionStorage.setItem('zenit_premium_modal_shown', 'true');
                }, 1200);
                return () => clearTimeout(timer);
            }
        }
    }, [ehFree]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-4 border-zinc-800 p-0 overflow-hidden text-white shadow-[8px_8px_0_rgba(0,0,0,0.5)] rounded-none font-minecraft uppercase">
                <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />

                <div className="relative p-6 sm:p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-emerald-600 border-4 border-emerald-400/50 rounded-none flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,0.3)] mb-6 animate-pulse">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>

                    <DialogHeader className="w-full mb-6">
                        <DialogTitle className="text-3xl font-black text-white mb-3 tracking-widest">
                            {t('unlockPotential')}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 text-sm sm:text-base px-2">
                            {t('accessPremiumFeatures', { fallback: 'Acesse recursos exclusivos como criação de metas ilimitadas, relatórios avançados e muito mais para impulsionar sua produtividade.' })}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="w-full flex flex-col gap-3 font-minecraft uppercase">
                        <Button
                            onClick={() => {
                                setIsOpen(false);
                                router.push('/premium');
                            }}
                            variant="premium"
                            className="w-full h-12 text-sm"
                        >
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            {t('upgradeToPremium')}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setIsOpen(false)}
                            className="w-full text-zinc-500 hover:text-white hover:bg-zinc-900 h-10 rounded-none tracking-widest"
                        >
                            Talvez mais tarde
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
