'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSession } from '@/lib/auth-mock';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/dexie';
import {
  User,
  Bell,
  Shield,
  Palette,
  ChevronLeft,
  Moon,
  Sun,
  Monitor,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Crown,
  CreditCard,
  Laptop,
  Camera,
  Loader2,
  Trash2,
  AtSign,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { PlanoManager } from '@/components/planos/PlanoManager';
import { cn } from '@/lib/utils';
import { ImageCropModal } from '@/components/settings/ImageCropModal';
import { ChangePasswordModal } from '@/components/settings/ChangePasswordModal';
import { DeleteAccountModal } from '@/components/settings/DeleteAccountModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

// --- Types ---
type SettingsTab = 'account' | 'appearance' | 'notifications' | 'privacy' | 'billing';

interface NavItem {
  id: SettingsTab;
  label: string;
  icon: React.ElementType;
  description: string;
}

// --- Constants ---
const NAV_ITEMS: NavItem[] = [
  { id: 'account', label: 'Minha Conta', icon: User, description: 'Dados pessoais e segurança' },
  { id: 'appearance', label: 'Aparência', icon: Palette, description: 'Temas e preferências visuais' },
  { id: 'notifications', label: 'Notificações', icon: Bell, description: 'Emails e alertas' },
  { id: 'privacy', label: 'Privacidade', icon: Shield, description: 'Dados e visibilidade' },
  { id: 'billing', label: 'Planos e Faturamento', icon: CreditCard, description: 'Gerencie sua assinatura' },
];

// --- Sub-components (Outside of render) ---
const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="mb-6">
    <h2 className="text-xl font-bold text-white tracking-tight uppercase tracking-[0.05em]">{title}</h2>
    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{description}</p>
    <Separator className="mt-4 bg-zinc-800/50" />
  </div>
);

const SettingsCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 shadow-sm", className)}>
    {children}
  </div>
);

const SettingRow = ({
  label,
  desc,
  action
}: {
  label: string;
  desc?: string;
  action: React.ReactNode
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 first:pt-0 last:pb-0 gap-4">
    <div className="space-y-0.5">
      <label className="text-sm font-medium text-zinc-200 block">{label}</label>
      {desc && <p className="text-xs text-zinc-500 max-w-[400px]">{desc}</p>}
    </div>
    <div className="shrink-0">{action}</div>
  </div>
);

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if came from profile page
  const fromProfile = searchParams.get('from') === 'profile';

  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Modal states
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // States
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');

  // Form state
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    phone: '',
  });

  // Username state
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [updatingUsername, setUpdatingUsername] = useState(false);
  const [canChangeUsername, setCanChangeUsername] = useState(true);
  const [nextChangeDate, setNextChangeDate] = useState<Date | null>(null);

  // Verificar quando pode alterar username
  useEffect(() => {
    const checkCanChange = async () => {
      try {
        const user = await db.users.get('offline-user-id');

        if (user && (user as any).usernameChangedAt) {
          const lastChange = new Date((user as any).usernameChangedAt);
          const nextChange = new Date(lastChange.getTime() + 30 * 24 * 60 * 60 * 1000);
          const now = new Date();

          if (now < nextChange) {
            setCanChangeUsername(false);
            setNextChangeDate(nextChange);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar data de alteração:', error);
      }
    };

    if (session?.user?.username) {
      checkCanChange();
    }
  }, [session?.user?.username]);

  // Validação de formato de username
  const validateUsernameFormat = (value: string): string => {
    if (value.length === 0) return '';
    if (value.length < 3) return 'Mínimo 3 caracteres';
    if (value.length > 30) return 'Máximo 30 caracteres';
    if (!/^[a-zA-Z0-9_.]+$/.test(value)) return 'Apenas letras, números, _ e .';
    if (value.startsWith('.') || value.endsWith('.')) return 'Não pode começar/terminar com ponto';
    if (value.includes('..')) return 'Pontos consecutivos não permitidos';
    return '';
  };

  // Verificar disponibilidade de username
  const checkUsernameAvailability = useCallback(async (value: string) => {
    if (!value || value.length < 3 || validateUsernameFormat(value)) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      // Offline mode - assume always available unless it's already their new username
      setUsernameAvailable(true);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  // Debounce para verificação de username
  useEffect(() => {
    const formatError = validateUsernameFormat(newUsername);
    setUsernameError(formatError);

    if (formatError || newUsername.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    // Verificar se é igual ao atual
    if (newUsername === session?.user?.username) {
      setUsernameError('O novo username deve ser diferente do atual');
      setUsernameAvailable(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(newUsername);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [newUsername, checkUsernameAvailability, session?.user?.username]);

  const handleNewUsernameChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/\s/g, '');
    setNewUsername(normalized);
  };

  const handleUpdateUsername = async () => {
    if (!canChangeUsername || !usernameAvailable || usernameError) {
      return;
    }

    setUpdatingUsername(true);
    try {
      await db.users.update('offline-user-id', {
        username: newUsername,
        usernameChangedAt: new Date()
      } as any);

      await update({ username: newUsername });
      setNewUsername('');
      setUsernameAvailable(null);
      setCanChangeUsername(false);
      setNextChangeDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      toast.success('Username atualizado com sucesso!');
    } catch {
      toast.error('Erro ao atualizar username');
    } finally {
      setUpdatingUsername(false);
    }
  };

  // Helpers
  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userToUpdate = {
        name: formData.name,
        email: formData.email,
        updatedAt: new Date()
      };

      const existingUser = await db.users.get('offline-user-id');
      if (existingUser) {
        await db.users.update('offline-user-id', userToUpdate);
      } else {
        await db.users.add({
          id: 'offline-user-id',
          name: formData.name,
          email: formData.email,
          plano: 'PREMIUM',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      await update({ name: formData.name });
      toast.success('Alterações salvas com sucesso');
    } catch {
      toast.error('Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Criar URL da imagem para o modal de crop
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setShowCropModal(true);

    // Limpar o input para permitir selecionar a mesma imagem novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setUploadingAvatar(true);
    const loadingToast = toast.loading('Enviando foto...');

    try {
      // Em simulação offline, pode ler via blob
      const imageUrl = URL.createObjectURL(croppedBlob);

      await db.users.update('offline-user-id', { image: imageUrl });
      await update({ image: imageUrl });
      toast.success('Foto de perfil atualizada!', { id: loadingToast });

    } catch {
      toast.error('Erro ao enviar foto. Tente novamente.', { id: loadingToast });
    } finally {
      setUploadingAvatar(false);
      // Limpar URL da imagem
      if (imageToCrop) {
        URL.revokeObjectURL(imageToCrop);
        setImageToCrop(null);
      }
    }
  };

  const handleRemoverAvatar = async () => {
    setUploadingAvatar(true);
    const loadingToast = toast.loading('Removendo foto...');

    try {
      await db.users.update('offline-user-id', { image: undefined });

      await update({ image: null });
      toast.success('Foto removida!', { id: loadingToast });

    } catch {
      toast.error('Erro ao remover foto. Tente novamente.', { id: loadingToast });
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page Header */}
        <PageHeader 
          title="Configurações"
          description="Gerencie sua conta e preferências do sistema."
          showBackButton={fromProfile}
        />

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* Sidebar Navigation */}
          <aside className="lg:w-64 shrink-0">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-none">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 whitespace-nowrap lg:whitespace-normal text-left",
                      isActive
                        ? "bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-800/50"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-emerald-400" : "text-zinc-600")} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 space-y-8">

            {/* --- ACCOUNT TAB --- */}
            {activeTab === 'account' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SectionHeader title="Informações Pessoais" description="Atualize sua foto e detalhes pessoais." />

                {/* Profile Card */}
                <SettingsCard className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="relative group cursor-pointer">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <Avatar className="w-24 h-24 border-4 border-zinc-900 shadow-xl">
                      <AvatarImage src={session?.user?.image || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-green-600 text-white text-2xl font-bold">
                        {getInitials(session?.user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      onClick={handleAvatarClick}
                    >
                      <div className="absolute inset-0 bg-black/60 rounded-full backdrop-blur-sm"></div>
                      {uploadingAvatar ? (
                        <Loader2 className="w-6 h-6 text-white relative z-10 animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white relative z-10" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-white">{session?.user?.name}</h3>
                      <Badge variant="outline" className="border-yellow-500/30 text-yellow-500 bg-yellow-500/10 gap-1 px-2 py-0.5">
                        <Crown className="w-3 h-3" />
                        {session?.user?.plano || 'Free'}
                      </Badge>
                    </div>
                    <p className="text-zinc-400">{session?.user?.email}</p>
                    <div className="pt-3 flex gap-3">
                      <Button
                        size="sm"
                        onClick={handleAvatarClick}
                        disabled={uploadingAvatar}
                        className="border-zinc-700 hover:bg-zinc-800 hover:text-white text-zinc-300"
                      >
                        {uploadingAvatar ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          'Alterar Foto'
                        )}
                      </Button>
                      {session?.user?.image && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleRemoverAvatar}
                          disabled={uploadingAvatar}
                          className="text-zinc-400 hover:text-red-400 hover:bg-red-950/30"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                </SettingsCard>

                {/* Form Fields */}
                <SettingsCard className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullname" className="text-zinc-300">Nome Completo</Label>
                      <Input
                        id="fullname"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-zinc-950/50 border-zinc-800 focus-visible:ring-zenit-500/50 text-zinc-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-zinc-300">Email Principal</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                          id="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="pl-9 bg-zinc-950/50 border-zinc-800 focus-visible:ring-zenit-500/50 text-zinc-100"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-zinc-300">Telefone</Label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                          id="phone"
                          placeholder="+55"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="pl-9 bg-zinc-950/50 border-zinc-800 focus-visible:ring-zenit-500/50 text-zinc-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-zinc-800">
                    <Button onClick={handleSave} disabled={isSaving} className="bg-white text-black hover:bg-zinc-200 font-medium">
                      {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </SettingsCard>

                {/* Username Section */}
                <SettingsCard>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
                          <AtSign className="w-5 h-5" />
                          Username
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">Seu identificador único no Azimov</p>
                      </div>
                      {session?.user?.username && (
                        <Badge variant="outline" className="border-zinc-700 text-zinc-300 gap-1 px-3">
                          @{session.user.username}
                        </Badge>
                      )}
                    </div>

                    <Separator className="bg-zinc-800" />

                    {!canChangeUsername ? (
                      <div className="flex items-center gap-3 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-zinc-300">
                            Você poderá alterar seu username novamente em:
                          </p>
                          <p className="text-sm font-medium text-zinc-100">
                            {nextChangeDate?.toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Label className="text-zinc-300">Novo username</Label>
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">@</div>
                            <Input
                              value={newUsername}
                              onChange={(e) => handleNewUsernameChange(e.target.value)}
                              placeholder="novo_username"
                              className="pl-7 pr-10 bg-zinc-950/50 border-zinc-800 text-zinc-100"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {checkingUsername && <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />}
                              {!checkingUsername && usernameAvailable === true && <Check className="w-4 h-4 text-green-500" />}
                              {!checkingUsername && usernameAvailable === false && <X className="w-4 h-4 text-red-500" />}
                            </div>
                          </div>
                          <Button
                            onClick={handleUpdateUsername}
                            disabled={updatingUsername || !usernameAvailable || !!usernameError}
                            className="bg-white text-black hover:bg-zinc-200"
                          >
                            {updatingUsername ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Salvando...
                              </>
                            ) : (
                              'Alterar'
                            )}
                          </Button>
                        </div>
                        {usernameError && (
                          <p className="text-xs text-red-400">{usernameError}</p>
                        )}
                        {!usernameError && usernameAvailable === true && (
                          <p className="text-xs text-green-400">Username disponível!</p>
                        )}
                        <p className="text-xs text-zinc-500">
                          Atenção: Após alterar, você deverá aguardar 30 dias para alterar novamente.
                        </p>
                      </div>
                    )}
                  </div>
                </SettingsCard>
              </div>
            )}

            {/* --- APPEARANCE TAB --- */}
            {activeTab === 'appearance' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SectionHeader title="Aparência" description="Customize a interface do sistema." />

                <SettingsCard>
                  <Label className="text-base text-zinc-200 mb-4 block">Tema da Interface</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'light', label: 'Claro', icon: Sun, comingSoon: true },
                      { id: 'dark', label: 'Escuro', icon: Moon, comingSoon: false },
                      { id: 'system', label: 'Sistema', icon: Monitor, comingSoon: true },
                    ].map((t) => {
                      const Icon = t.icon;
                      const isSelected = theme === t.id;
                      const isDisabled = t.comingSoon;
                      return (
                        <div
                          key={t.id}
                          onClick={() => !isDisabled && setTheme(t.id as 'light' | 'dark' | 'system')}
                          className={cn(
                            "rounded-xl border-2 p-4 transition-all",
                            isDisabled
                              ? "cursor-not-allowed opacity-60 border-zinc-800"
                              : "cursor-pointer hover:bg-zinc-900",
                            isSelected && !isDisabled
                              ? "border-zenit-500 bg-zinc-900 ring-1 ring-zenit-500/20"
                              : !isDisabled && "border-zinc-800 hover:border-zinc-700"
                          )}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className={cn("p-2 rounded-full", isSelected && !isDisabled ? "bg-zenit-500/20 text-zenit-400" : "bg-zinc-800 text-zinc-400")}>
                              <Icon className="w-5 h-5" />
                            </div>
                            {isDisabled ? (
                              <Badge variant="outline" className="bg-zinc-900 border-zinc-700 text-zinc-400 text-xs">Em Breve</Badge>
                            ) : (
                              isSelected && <CheckCircle2 className="w-5 h-5 text-zenit-500" />
                            )}
                          </div>
                          <span className={cn("font-medium", isSelected && !isDisabled ? "text-white" : "text-zinc-400")}>{t.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </SettingsCard>
              </div>
            )}

            {/* --- NOTIFICATIONS TAB --- */}
            {activeTab === 'notifications' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SectionHeader title="Notificações" description="Escolha o que você quer receber." />

                <SettingsCard className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-full bg-zinc-800/50 mb-4">
                    <Bell className="w-8 h-8 text-zinc-500" />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-200 mb-2">Em Breve</h3>
                  <p className="text-sm text-zinc-500 max-w-sm">
                    As configurações de notificações estarão disponíveis em uma atualização futura.
                  </p>
                  <Badge variant="outline" className="mt-4 bg-zinc-900 border-zinc-700 text-zinc-400">
                    Em Desenvolvimento
                  </Badge>
                </SettingsCard>
              </div>
            )}

            {/* --- PRIVACY TAB --- */}
            {activeTab === 'privacy' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SectionHeader title="Segurança" description="Gerencie suas credenciais e acesso." />

                <SettingsCard className="space-y-1">
                  <SettingRow
                    label="Senha"
                    desc="Altere sua senha de acesso."
                    action={
                      <Button
                        variant="default"
                        size="sm"
                        className="border-zinc-700 text-zinc-300"
                        onClick={() => setShowPasswordModal(true)}
                      >
                        Redefinir
                      </Button>
                    }
                  />
                  <Separator className="bg-zinc-800/50" />
                  <SettingRow
                    label="Autenticação em Dois Fatores"
                    desc="Adicione uma camada extra de segurança à sua conta."
                    action={<Badge variant="outline" className="bg-zinc-900 border-zinc-700 text-zinc-400">Em Breve</Badge>}
                  />
                </SettingsCard>

                {/* Danger Zone - Discreto */}
                <div className="pt-6">
                  <div className="border border-zinc-800 rounded-xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-zinc-400 mb-1">
                          Encerrar conta
                        </h3>
                        <p className="text-xs text-zinc-500">
                          Esta ação é permanente e não pode ser desfeita.
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteModal(true)}
                        className="text-zinc-500 hover:text-zinc-400 hover:bg-zinc-900 text-xs"
                      >
                        Excluir conta
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- BILLING TAB --- */}
            {activeTab === 'billing' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SectionHeader title="Planos e Faturamento" description="Gerencie sua assinatura e métodos de pagamento." />

                {/* Embedded Original Component */}
                <PlanoManager />

                <SettingsCard>
                  <div className="flex items-center gap-4 text-zinc-400 text-sm">
                    <Laptop className="w-4 h-4" />
                    <span>Precisa de uma fatura empresarial? <a href="#" className="text-zenit-400 hover:underline">Entre em contato</a>.</span>
                  </div>
                </SettingsCard>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* Modais */}
      {imageToCrop && (
        <ImageCropModal
          isOpen={showCropModal}
          onClose={() => {
            setShowCropModal(false);
            if (imageToCrop) {
              URL.revokeObjectURL(imageToCrop);
              setImageToCrop(null);
            }
          }}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
        />
      )}

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
