'use client';

import { useTranslations } from 'next-intl';
import { Heart } from 'lucide-react';

export function Footer() {
  const t = useTranslations('common');
  
  return (
    <footer className="shrink-0 border-t border-zinc-800 bg-zinc-950 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
        <span>© {new Date().getFullYear()} Azimov</span>
        <span className="text-zinc-800">•</span>
        <span>{t('footerTagline') || 'Gestão Pessoal Inteligente'}</span>
      </div>
      
      <div className="flex items-center gap-4 text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
          <Heart className="w-3 h-3 text-red-500" />
          <span className="font-minecraft text-[12px] translate-y-[0.5px]">LVL 12</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-emerald-500 transition-colors">{t('terms') || 'Termos'}</a>
          <a href="#" className="hover:text-emerald-500 transition-colors">{t('privacy') || 'Privacidade'}</a>
        </div>
      </div>
    </footer>
  );
}
