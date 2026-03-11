'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from '@/lib/auth-mock';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Menu, Bell, Crown, User, Settings, LogOut, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { NotificationBell } from '@/components/ui/NotificationBell';

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = useTranslations('header');

  // Sempre usar o valor mais recente da sessão diretamente
  const currentPlano = session?.user?.plano || 'FREE';

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3">
        {/* Mobile Menu + Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Sidebar */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden hover:bg-zinc-800 h-8 w-8 sm:h-9 sm:w-9">
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-zinc-950 border-zinc-800">
              <VisuallyHidden>
                <SheetTitle>{t('navigationMenu')}</SheetTitle>
              </VisuallyHidden>
              <Sidebar isMobile onNavigate={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Logo (mobile only) */}
          <h1 className="text-xl font-bold text-white lg:hidden flex items-center gap-2">
            <Image
              src="/images/logo-sem-fundo.png"
              alt="Zênit Logo"
              width={20}
              height={20}
              className="w-5 h-5 object-contain"
            />
            Zênit
          </h1>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Notificações */}
          <NotificationBell />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 h-9 rounded-xl transition-all">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={session?.user?.image || undefined} />
                  <AvatarFallback className="bg-zinc-800 text-zinc-100 text-xs">
                    {getInitials(session?.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left mr-1">
                  <p className="text-sm font-bold leading-none text-zinc-100">{session?.user?.name}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-zinc-950 border-zinc-800 p-0 shadow-2xl rounded-2xl overflow-hidden">
              {/* Header do Menu */}
              <div className="p-6 bg-zinc-900/50 border-b border-zinc-800">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14 border border-zinc-700">
                    <AvatarImage src={session?.user?.image || undefined} />
                    <AvatarFallback className="bg-zinc-800 text-white text-xl font-bold">
                      {getInitials(session?.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-white truncate">{session?.user?.name}</p>
                    <p className="text-xs text-zinc-500 font-medium truncate mb-2">{session?.user?.email}</p>
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-zinc-800 rounded-full border border-zinc-700">
                      <Crown className={`w-3 h-3 ${currentPlano === 'PREMIUM' ? 'text-emerald-500' : 'text-zinc-500'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${currentPlano === 'PREMIUM'
                        ? 'text-emerald-500'
                        : 'text-zinc-500'
                        }`}>
                        {currentPlano || 'FREE'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-zinc-900 focus:bg-zinc-900 rounded-xl px-4 py-3 flex items-center gap-4 transition-all"
                  onClick={() => router.push('/dashboard/perfil')}
                >
                  <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center rounded-xl group-hover:border-zinc-700 transition-colors">
                    <User className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-zinc-100 uppercase tracking-tight">{t('myProfile')}</p>
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5 opacity-50">{t('viewAndEdit')}</p>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer hover:bg-zinc-900 focus:bg-zinc-900 rounded-xl px-4 py-3 flex items-center gap-4 transition-all"
                  onClick={() => router.push('/dashboard/settings')}
                >
                  <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center rounded-xl group-hover:border-zinc-700 transition-colors">
                    <Settings className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-zinc-100 uppercase tracking-tight">{t('settings')}</p>
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5 opacity-50">{t('systemPreferences')}</p>
                  </div>
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator className="bg-zinc-800 mx-4 h-px" />

              {/* Upgrade CTA */}
              {currentPlano === 'FREE' && (
                <>
                  <div className="p-2">
                    <DropdownMenuItem
                      className="cursor-pointer bg-emerald-500/5 hover:bg-emerald-500/10 focus:bg-emerald-500/10 rounded-xl px-4 py-3 flex items-center gap-4 transition-all border border-emerald-500/10 hover:border-emerald-500/20 m-1"
                      onClick={() => router.push('/premium')}
                    >
                      <div className="w-10 h-10 bg-emerald-500/10 flex items-center justify-center rounded-xl">
                        <Sparkles className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-emerald-500 uppercase tracking-tight">{t('upgrade')}</p>
                        <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest mt-0.5">{t('unlockPremium')}</p>
                      </div>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="bg-zinc-800 mx-4 h-px" />
                </>
              )}

              {/* Logout */}
              <div className="p-2 pb-4">
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-red-500/5 focus:bg-red-500/5 rounded-xl px-4 py-3 flex items-center gap-4 transition-all group"
                  onClick={() => signOut()}
                >
                  <div className="w-10 h-10 bg-red-500/10 flex items-center justify-center rounded-xl group-hover:bg-red-500/20 transition-colors">
                    <LogOut className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-500 uppercase tracking-tight">{t('logout')}</p>
                    <p className="text-[11px] font-bold text-red-600/60 uppercase tracking-widest mt-0.5">{t('endSession')}</p>
                  </div>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}