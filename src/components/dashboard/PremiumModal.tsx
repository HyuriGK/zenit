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
            <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 p-0 overflow-hidden text-white shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-zenit-500/10 via-blue-500/10 to-green-500/10 pointer-events-none" />
                <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative p-6 sm:p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-zenit-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-zenit-500/20 mb-6 animate-pulse-slow">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>

                    <DialogHeader className="w-full mb-6">
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent mb-3">
                            {t('unlockPotential')}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 text-sm sm:text-base px-2">
                            {t('accessPremiumFeatures', { fallback: 'Acesse recursos exclusivos como criação de metas ilimitadas, relatórios avançados e muito mais para impulsionar sua produtividade.' })}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="w-full flex flex-col gap-3">
                        <Button
                            onClick={() => {
                                setIsOpen(false);
                                router.push('/premium');
                            }}
                            className="w-full bg-gradient-to-r from-zenit-500 to-blue-500 hover:from-zenit-600 hover:to-blue-600 shadow-lg shadow-zenit-500/25 h-12 text-base rounded-xl transition-all active:scale-[0.98] border-0"
                        >
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            {t('upgradeToPremium')}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setIsOpen(false)}
                            className="w-full text-zinc-500 hover:text-white hover:bg-zinc-800/50 h-10 rounded-xl"
                        >
                            Talvez mais tarde
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
