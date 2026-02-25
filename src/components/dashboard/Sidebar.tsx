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
  Library,
  Settings,
  Crown,
  ChevronLeft,
  ChevronRight,
  Heart,
  TrendingUp
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePlano } from '@/hooks/usePlano';

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

  const menuItems = [
    { icon: LayoutDashboard, label: t('dashboard'), href: '/dashboard' },
    { icon: Heart, label: t('habits'), href: '/dashboard/habitos' },
    { icon: Calendar, label: t('agenda'), href: '/dashboard/agenda' },
    { icon: Wallet, label: t('financial'), href: '/dashboard/financeiro' },
    { icon: TrendingUp, label: t('investments'), href: '/dashboard/investimentos' },
    { icon: BookOpen, label: t('studies'), href: '/dashboard/estudos' },
    { icon: Library, label: t('library'), href: '/dashboard/biblioteca' },
  ];

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '5rem' : '16rem');
    }
  }, [isCollapsed]);

  return (
    <aside className={`${isMobile ? 'flex' : 'hidden lg:flex'} flex-col h-screen fixed left-0 top-0 border-r border-zinc-800 bg-zinc-900/50 backdrop-blur-xl transition-all duration-300 z-40 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo */}
      <div className={`border-b border-zinc-800 bg-zinc-900 flex items-center ${isCollapsed ? 'p-4 justify-center' : 'p-6 justify-between'}`}>
        {!isCollapsed && (
          <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
            <h1 className="text-2xl font-extrabold">
              <span className="bg-gradient-to-r from-zenit-400 via-blue-400 to-green-400 bg-clip-text text-transparent drop-shadow-md">
                Zênit
              </span>
            </h1>
            <p className="text-xs text-gray-500">{t('personalManagement')}</p>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
            <Image
              src="/images/logo-sem-fundo.png"
              alt="Zênit Logo"
              width={96}
              height={96}
              className="w-12 h-12 flex-shrink-0 object-contain"
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
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative group
                ${isActive
                  ? 'bg-zenit-500/10 text-zenit-400 border border-zenit-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-zinc-800/50'
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
          <div className="bg-gradient-to-br from-zenit-500/10 to-blue-500/10 border border-zenit-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold text-sm">{t('freePlan')}</h3>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              {t('unlockPremiumFeatures')}
            </p>
            <button
              onClick={() => router.push('/premium')}
              className="w-full bg-gradient-to-r from-zenit-500 to-blue-500 hover:from-zenit-600 hover:to-blue-600 text-white text-sm font-medium py-2 rounded-lg transition-all">
              {t('upgrade')}
            </button>
          </div>
        </div>
      )}

      {ehFree && isCollapsed && (
        <div className="p-4 border-t border-zinc-800 flex justify-center">
          <button
            onClick={() => router.push('/premium')}
            className="bg-gradient-to-r from-zenit-500 to-blue-500 hover:from-zenit-600 hover:to-blue-600 text-white p-2 rounded-lg transition-all"
            title={t('upgrade')}>
            <Crown className="w-5 h-5 text-yellow-500" />
          </button>
        </div>
      )}

      {/* Settings */}
      <div className={`border-t border-zinc-800 ${isCollapsed ? 'p-2 flex justify-center' : 'px-4 py-2'}`}>
        <Link
          href="/dashboard/settings"
          onClick={onNavigate}
          className={`flex items-center rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800/50 transition-all ${isCollapsed ? 'justify-center p-2.5' : 'w-full gap-3 px-3 py-2.5'}`}
          title={isCollapsed ? t('settings') : ''}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!isCollapsed && (
            <span className="font-medium text-sm">{t('settings')}</span>
          )}
        </Link>
      </div>
    </aside>
  );
}