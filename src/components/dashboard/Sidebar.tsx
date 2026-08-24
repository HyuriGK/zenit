'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Calendar,
  Wallet,
  BookOpen,
  Settings as IconSettings,
  Crown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Car,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePlano } from '@/hooks/usePlano';
import { useSession } from '@/lib/auth-mock';
import { isAdminEmail } from '@/lib/admin';

interface SidebarProps {
  isMobile?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ isMobile = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const t = useTranslations('sidebar');
  const { ehFree } = usePlano();
  const { data: session } = useSession();

  const menuItems = [
    { icon: LayoutDashboard, label: t('dashboard'), href: '/dashboard' },
    { icon: Calendar, label: t('agenda'), href: '/dashboard/agenda' },
    { icon: Wallet, label: t('financial'), href: '/dashboard/financeiro' },
    { icon: Car, label: t('vehicles'), href: '/dashboard/veiculos' },
    { icon: TrendingUp, label: t('investments'), href: '/dashboard/investimentos' },
    { icon: KeyRound, label: t('passwords'), href: '/dashboard/senhas' },
    { icon: BookOpen, label: t('studies'), href: '/dashboard/estudos' },
  ];

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '5rem' : '16rem');
    }
  }, [isCollapsed]);

  return (
    <aside className={`${isMobile ? 'flex' : 'hidden lg:flex'} flex-col h-screen fixed left-0 top-0 border-r border-zinc-800 bg-zinc-950 transition-all duration-300 z-40 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo */}
      <div className={`border-b border-zinc-800 flex items-center ${isCollapsed ? 'p-4 justify-center' : 'p-6 justify-between'}`}>
        {!isCollapsed && (
          <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Image
                src="/images/logo-sem-fundo.png"
                alt="Logo Azimov"
                width={24}
                height={24}
                className="w-6 h-6 object-contain"
              />
              Azimov
            </h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{t('personalManagement')}</p>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
            <Image
              src="/images/logo-sem-fundo.png"
              alt="Logo Azimov"
              width={32}
              height={32}
              className="w-8 h-8 flex-shrink-0 object-contain"
            />
          </Link>
        )}
        {!isMobile && !isCollapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-zinc-800 rounded flex-shrink-0"
            aria-label={t('collapseSidebar')}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>
      {!isMobile && isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 mx-auto mt-2"
          aria-label={t('expandSidebar')}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}


      {/* Menu */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-xl transition-all relative group
                ${isActive
                  ? 'bg-emerald-600/10 text-emerald-500 font-bold'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? item.label : ''}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="flex-1 font-medium text-sm">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade Card - Only show for free plan */}
      {ehFree && !isCollapsed && (
        <div className="p-4 border-t border-zinc-800">
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-emerald-500" />
              <h3 className="font-bold text-xs text-white">{t('freePlan')}</h3>
            </div>
            <p className="text-[10px] text-zinc-500 leading-tight mb-3">
              {t('unlockPremiumFeatures')}
            </p>
            <button
              onClick={() => router.push('/premium')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-xl transition-all active:scale-[0.98]">
              {t('upgrade')}
            </button>
          </div>
        </div>
      )}

      {ehFree && isCollapsed && (
        <div className="p-4 border-t border-zinc-800 flex justify-center">
          <button
            onClick={() => router.push('/premium')}
            className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 p-2 rounded-xl transition-all"
            title={t('upgrade')}>
            <Crown className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Settings */}
      <div className={`border-t border-zinc-800 ${isCollapsed ? 'p-2 flex justify-center' : 'px-4 py-2'}`}>
        {isAdminEmail(session?.user?.email) && (
          <Link
            href="/dashboard/admin"
            onClick={onNavigate}
            className={`mb-1 flex items-center rounded-xl text-violet-300 hover:bg-violet-500/10 hover:text-violet-200 transition-all ${isCollapsed ? 'justify-center p-2' : 'w-full gap-3 px-3 py-2'}`}
            title={isCollapsed ? 'Administração' : ''}
          >
            <ShieldCheck className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="font-semibold text-sm">Administração</span>}
          </Link>
        )}
        <Link
          href="/dashboard/settings"
          onClick={onNavigate}
          className={`flex items-center rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all ${isCollapsed ? 'justify-center p-2' : 'w-full gap-3 px-3 py-2'}`}
          title={isCollapsed ? t('settings') : ''}
        >
          <IconSettings className="w-5 h-5 shrink-0" />
          {!isCollapsed && (
            <span className="font-semibold text-sm">{t('settings')}</span>
          )}
        </Link>
      </div>
    </aside>
  );
}
