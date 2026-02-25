'use client';

import { useState, useEffect, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Check, Globe } from 'lucide-react';

type Locale = 'pt' | 'en';

const FlagBR = () => (
  <svg viewBox="0 0 640 480" className="w-6 h-6">
    <g fillRule="evenodd" strokeWidth="1pt">
      <path fill="#229e45" d="M0 0h640v480H0z"/>
      <path fill="#f8e509" d="m321.4 436 301.5-195.7L319.6 44 17.1 240.7 321.4 436z"/>
      <path fill="#2b49a3" d="M452.8 240c0 70.3-57.1 127.3-127.6 127.3A127.4 127.4 0 1 1 452.8 240z"/>
      <path fill="#ffffef" d="M283.3 316.3c-3.5 0-3.8-1.8-7.4-5-5.5-5-7.8-6.2-10.6-6.2-1.8 0-2.7.3-5.9 2.4-2.4 1.5-3.8 2.1-5.6 2.1-3.2 0-6.7-2.9-10.9-8.7-5.3-7.4-7.1-13.3-7.1-23.1 0-8 1.5-14.5 4.7-20.5 2.9-5.6 6.2-9.2 10.9-12.4 3.8-2.4 7.4-3.5 11.5-3.5 4.4 0 6.2.9 12.1 5.6 3.5 2.9 5.3 3.8 7.4 3.8 1.8 0 3.2-.6 7.1-3.5 5.6-4.4 8.3-5.9 12.1-5.9 5 0 9.7 2.1 14.2 6.2 2.7 2.4 5.9 6.8 7.4 10 .9 1.8 1.2 2.7 1.2 3.5 0 .6-.6 1.2-1.5 1.2-.6 0-1.2-.3-2.7-1.2-5.9-3.5-10-4.7-15-4.7-5.3 0-9.4 1.5-14.5 5.6-5.9 4.7-8.5 5.9-12.4 5.9-4.1 0-7.1-1.5-13-5.3-5-3.2-7.4-4.4-10.6-4.4-8 0-14.7 6.2-18.6 17.4-1.2 3.8-1.8 8-1.8 13.6 0 8.9 2.1 15.6 6.5 20.9 2.4 2.9 5 4.1 8 4.1 2.4 0 3.8-.6 8.6-3.8 4.1-2.7 6.5-3.8 9.1-3.8 2.9 0 5.6 1.2 10.3 5 5.9 5 7.4 5.9 11.2 5.9 4.4 0 8.3-1.8 13.9-6.5 2.1-1.8 5.3-5 6.5-6.5.6-.9 1.2-1.2 1.8-1.2.9 0 1.5.6 1.5 1.5 0 1.5-4.1 7.1-8 10.9-5.9 5.6-11.5 8.3-17.7 8.3-4.7 0-6.7-.9-12.4-5.3-5.3-4.1-7.6-5.3-10.6-5.3z"/>
    </g>
  </svg>
);

const FlagUS = () => (
  <svg viewBox="0 0 640 480" className="w-6 h-6">
    <defs>
      <marker id="us-a" markerHeight="30" markerWidth="30">
        <path fill="#fff" d="m14 0 9 27L0 10h28L5 27z"/>
      </marker>
    </defs>
    <path fill="#bd3d44" d="M0 0h640v480H0"/>
    <path stroke="#fff" strokeWidth="37" d="M0 55.3h640M0 129h640M0 203h640M0 277h640M0 351h640M0 425h640"/>
    <path fill="#192f5d" d="M0 0h364.8v258.5H0"/>
    <path fill="none" markerMid="url(#us-a)" d="m0 0 16 11h61 61 61 61 60L47 37h61 61 60 61L16 63h61 61 61 61 60L47 89h61 61 60 61L16 115h61 61 61 61 60L47 141h61 61 60 61L16 166h61 61 61 61 60L47 192h61 61 60 61L16 218h61 61 61 61 60z"/>
  </svg>
);

const languages = [
  {
    code: 'pt' as Locale,
    name: 'Português',
    flag: FlagBR,
  },
  {
    code: 'en' as Locale,
    name: 'English',
    flag: FlagUS,
  },
];

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [currentLocale, setCurrentLocale] = useState<Locale>('pt');
  const t = useTranslations('common');

  useEffect(() => {
    // Carregar idioma salvo do localStorage
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale && languages.find(lang => lang.code === savedLocale)) {
      setCurrentLocale(savedLocale);
    }
  }, []);

  const currentLanguage = languages.find((lang) => lang.code === currentLocale) || languages[0];

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) {
      setIsOpen(false);
      return;
    }

    startTransition(() => {
      // Salvar no localStorage e cookie
      localStorage.setItem('locale', newLocale);
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`; // 1 ano
      setCurrentLocale(newLocale);
      setIsOpen(false);

      // Recarregar a página para aplicar as novas traduções
      window.location.reload();
    });
  };

  const FlagComponent = currentLanguage.flag;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative hover:bg-zinc-800 h-8 w-8 sm:h-9 sm:w-9"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
      >
        <FlagComponent />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 min-w-50 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {t('language')}
              </div>
              {languages.map((language) => {
                const LangFlag = language.flag;
                return (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    disabled={isPending}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                      ${currentLocale === language.code
                        ? 'bg-zenit-500/10 text-zenit-400'
                        : 'hover:bg-zinc-800 text-white'
                      }
                      ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <LangFlag />
                    <span className="flex-1 text-sm font-medium">{language.name}</span>
                    {currentLocale === language.code && (
                      <Check className="w-4 h-4 text-zenit-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
