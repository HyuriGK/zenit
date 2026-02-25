'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from '@/lib/auth-mock';
import { useRouter } from 'next/navigation';
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
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
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
            <SheetContent side="left" className="p-0 w-64 bg-zinc-900 border-zinc-800">
              <VisuallyHidden>
                <SheetTitle>{t('navigationMenu')}</SheetTitle>
              </VisuallyHidden>
              <Sidebar isMobile onNavigate={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Logo (mobile only) */}
          <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-zenit-400 to-blue-400 bg-clip-text text-transparent lg:hidden">
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
              <Button variant="ghost" className="gap-1.5 sm:gap-2 px-1.5 sm:px-2 hover:bg-zinc-800 h-8 sm:h-9">
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                  <AvatarImage src={session?.user?.image || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-zenit-500 to-blue-500 text-white text-xs sm:text-sm">
                    {getInitials(session?.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[150px]">{session?.user?.email}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 bg-zinc-900 border-zinc-800 p-0">
              {/* Header do Menu */}
              <div className="p-4 bg-gradient-to-br from-zenit-500/10 via-blue-500/10 to-green-500/10 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-zenit-500/20">
                    <AvatarImage src={session?.user?.image || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-zenit-500 to-blue-500 text-white text-lg font-bold">
                      {getInitials(session?.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{session?.user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Crown className={`w-3 h-3 ${currentPlano === 'PREMIUM' ? 'text-green-500' : 'text-gray-500'}`} />
                      <span className={`text-xs font-semibold ${currentPlano === 'PREMIUM'
                        ? 'bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent'
                        : 'text-gray-400'
                        }`}>
                        {t('plan')} {currentPlano || 'FREE'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 rounded-lg px-3 py-2.5 flex items-center gap-3 transition-colors"
                  onClick={() => router.push('/dashboard/perfil')}
                >
                  <div className="p-1.5 bg-zenit-500/10 rounded-lg">
                    <User className="w-4 h-4 text-zenit-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{t('myProfile')}</p>
                    <p className="text-xs text-gray-500">{t('viewAndEdit')}</p>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 rounded-lg px-3 py-2.5 flex items-center gap-3 transition-colors"
                  onClick={() => router.push('/dashboard/settings')}
                >
                  <div className="p-1.5 bg-blue-500/10 rounded-lg">
                    <Settings className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{t('settings')}</p>
                    <p className="text-xs text-gray-500">{t('systemPreferences')}</p>
                  </div>
                </DropdownMenuItem>
              </div>

              <DropdownMenuSeparator className="bg-zinc-800 my-1" />

              {/* Upgrade CTA */}
              {currentPlano === 'FREE' && (
                <>
                  <div className="p-2">
                    <DropdownMenuItem
                      className="cursor-pointer hover:bg-gradient-to-r hover:from-yellow-500/20 hover:to-orange-500/20 focus:bg-gradient-to-r focus:from-yellow-500/20 focus:to-orange-500/20 rounded-lg px-3 py-2.5 flex items-center gap-3 transition-all border border-yellow-500/20"
                      onClick={() => router.push('/premium')}
                    >
                      <div className="p-1.5 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg">
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">{t('upgrade')}</p>
                        <p className="text-xs text-gray-500">{t('unlockPremium')}</p>
                      </div>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator className="bg-zinc-800 my-1" />
                </>
              )}

              {/* Logout */}
              <div className="p-2">
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10 rounded-lg px-3 py-2.5 flex items-center gap-3 transition-colors group"
                  onClick={() => signOut()}
                >
                  <div className="p-1.5 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                    <LogOut className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-400">{t('logout')}</p>
                    <p className="text-xs text-gray-500">{t('endSession')}</p>
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