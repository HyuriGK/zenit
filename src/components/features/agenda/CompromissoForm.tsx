'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-mock';
import { Button } from '@/components/ui/button';
import { Compromisso, TipoRecorrencia } from '@/types/compromisso';
import { UpgradeToPremiumModal } from '@/components/planos/UpgradeToPremiumModal';
import { verificarAcessoRecurso } from '@/lib/planos-helper';
import { RecursoPremium, PlanoUsuario } from '@/types/planos';
import { 
  Crown, 
  Clock, 
  Tag, 
  AlignLeft, 
  RefreshCw, 
  Calendar, 
  Loader2, 
  AlertCircle,
  CalendarDays
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CompromissoFormProps {
  onClose: () => void;
  onSave: (data: { id: string; titulo: string }) => void;
  initialDate?: Date;
  initialHour?: string;
  initialData?: Compromisso | null;
}

export function CompromissoForm({ onClose, onSave, initialDate, initialHour, initialData }: CompromissoFormProps) {
  const t = useTranslations('agenda');
  const isEditMode = !!initialData;

  const categorias = [
    { value: 'trabalho', label: t('work'), cor: '#10B981' },
    { value: 'pessoal', label: t('personal'), cor: '#3B82F6' },
    { value: 'saude', label: t('health'), cor: '#10B981' },
    { value: 'estudo', label: t('study'), cor: '#F97316' },
    { value: 'lazer', label: t('leisure'), cor: '#EC4899' },
    { value: 'outro', label: t('other'), cor: '#6B7280' },
  ];

  const tiposRecorrencia = [
    { value: 'diario', label: t('daily') },
    { value: 'semanal', label: t('weekly') },
    { value: 'mensal', label: t('monthly') },
    { value: 'anual', label: t('yearly') },
  ];

  const [titulo, setTitulo] = useState(initialData?.titulo || '');
  const [descricao, setDescricao] = useState(initialData?.descricao || '');
  const [data, setData] = useState(
    initialData
      ? initialData.data.split('T')[0]
      : initialDate
        ? initialDate.toISOString().split('T')[0]
        : ''
  );
  const [horaInicio, setHoraInicio] = useState(initialData?.horaInicio || initialHour || '');
  const [horaFim, setHoraFim] = useState(initialData?.horaFim || '');
  const [categoria, setCategoria] = useState(initialData?.categoria || 'trabalho');

  // Estados de recorrência
  const [isRecorrente, setIsRecorrente] = useState(initialData?.isRecorrente || false);
  const [tipoRecorrencia, setTipoRecorrencia] = useState<TipoRecorrencia>(
    initialData?.tipoRecorrencia || 'semanal'
  );
  const [intervaloRecorrencia, setIntervaloRecorrencia] = useState(
    initialData?.intervaloRecorrencia || 1
  );
  const [dataFimRecorrencia, setDataFimRecorrencia] = useState(
    initialData?.dataFimRecorrencia?.split('T')[0] || ''
  );

  // Estado Google Calendar
  const [syncWithGoogle, setSyncWithGoogle] = useState(initialData?.syncWithGoogle || false);
  const [hasGoogleAuth, setHasGoogleAuth] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  // Verificar se o usuário tem acesso ao recurso de sincronização com Google
  const plano = (session?.user?.plano as PlanoUsuario) || PlanoUsuario.FREE;
  const planoExpiraEm = (session?.user as any)?.planoExpiraEm;
  const acessoRecurso = verificarAcessoRecurso(
    plano,
    planoExpiraEm,
    RecursoPremium.SINCRONIZAR_GOOGLE_CALENDAR
  );
  const canSyncGoogle = acessoRecurso.temAcesso;

  // Verificar se usuário tem autenticação do Google
  useEffect(() => {
    setHasGoogleAuth(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const [year, month, day] = data.split('-').map(Number);
      const [hour, minute] = horaInicio.split(':').map(Number);
      const dataSelecionadaLocal = new Date(year, month - 1, day, hour, minute);

      const payload: any = {
        titulo,
        descricao,
        data: dataSelecionadaLocal,
        horaInicio,
        horaFim,
        categoria,
        cor: categorias.find(c => c.value === categoria)?.cor || '#3B82F6',
        isRecorrente,
        tipoRecorrencia: isRecorrente ? tipoRecorrencia : null,
        intervaloRecorrencia: isRecorrente ? intervaloRecorrencia : null,
        dataFimRecorrencia: (isRecorrente && dataFimRecorrencia)
          ? (() => {
            const [y, m, d] = dataFimRecorrencia.split('-').map(Number);
            return new Date(y, m - 1, d, 23, 59, 59);
          })()
          : null,
      };

      if (isEditMode && initialData) {
        const editPayload = { ...payload, id: initialData.id };
        const response = await fetch('/api/agenda', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editPayload)
        });

        if (!response.ok) throw new Error('Falha ao atualizar na Nuvem');
        onSave({ id: initialData.id, titulo });
      } else {
        const id = crypto.randomUUID();
        const createPayload = {
          ...payload,
          id,
          userId: '12345678-user-mock-abcd',
        };
        const response = await fetch('/api/agenda', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createPayload)
        });

        if (!response.ok) throw new Error('Falha ao salvar na Nuvem');
        onSave({ id, titulo });
      }

      onClose();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar no banco (Neon)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-visible">
      {/* Header com Gradiente */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-900/50 p-6 border-b border-zinc-800/50">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-green-500/20 text-green-400">
              <CalendarDays className="w-6 h-6" />
            </div>
            {isEditMode ? t('editAppointment') : t('newAppointment')}
          </DialogTitle>
          <DialogDescription className="text-zinc-500 font-medium text-base ml-12">
            {isEditMode ? t('updateInfo') : t('fillDetails')}
          </DialogDescription>
        </DialogHeader>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-visible">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Coluna Esquerda: Dados Principais */}
          <div className="space-y-6">
            {/* Título */}
            <div>
              <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 block">
                {t('titlePlaceholder').split('...')[0]}
              </Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder={t('titlePlaceholder')}
                required
                className="bg-zinc-900/50 border-zinc-800 text-white h-12 px-4 rounded-xl placeholder:text-zinc-600 focus:border-zinc-700 focus-visible:ring-0 focus:ring-0 focus:outline-none transition-all text-base"
                autoFocus
              />
            </div>

            {/* Data e Hora */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 block">
                  Data
                </Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    required
                    className="bg-zinc-900/50 border-zinc-800 text-white h-12 px-4 rounded-xl focus:border-zinc-700 focus-visible:ring-0 focus:ring-0 focus:outline-none transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 block">
                    Início
                  </Label>
                  <Input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    required
                    className="bg-zinc-900/50 border-zinc-800 text-white h-12 px-2 rounded-xl focus:border-zinc-700 focus-visible:ring-0 focus:ring-0 focus:outline-none transition-all text-center"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 block">
                    Fim
                  </Label>
                  <Input
                    type="time"
                    value={horaFim}
                    onChange={(e) => setHoraFim(e.target.value)}
                    className="bg-zinc-900/50 border-zinc-800 text-white h-12 px-2 rounded-xl focus:border-zinc-700 focus-visible:ring-0 focus:ring-0 focus:outline-none transition-all text-center"
                  />
                </div>
              </div>
            </div>

            {/* Categoria */}
            <div>
              <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 block">
                {t('category')}
              </Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white h-12 px-4 rounded-xl focus:border-zinc-700 focus-visible:ring-0 focus:ring-0 focus-visible:ring-offset-0 focus:outline-none transition-all">
                  <SelectValue placeholder={t('category')} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800/80 rounded-xl shadow-2xl overflow-visible">
                  {categorias.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value} className="text-white hover:text-white focus:text-white hover:bg-zinc-900 focus:bg-zinc-900 rounded-lg m-1 py-2 cursor-pointer transition-colors duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full ring-4 ring-white/5" style={{ backgroundColor: cat.cor }} />
                        <span className="font-medium">{cat.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div>
              <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 block">
                {t('descriptionPlaceholder').split('...')[0]}
              </Label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
                rows={3}
                className="bg-zinc-900/50 border-zinc-800 text-white resize-none rounded-xl p-4 placeholder:text-zinc-600 focus:border-zinc-700 focus-visible:ring-0 focus:ring-0 focus:outline-none transition-all min-h-[100px]"
              />
            </div>
          </div>

          {/* Coluna Direita: Recorrência e Configurações */}
          <div className="space-y-6">
            {/* Recorrência */}
            <div className={`bg-zinc-900/40 rounded-2xl border border-zinc-800 shadow-sm transition-all duration-300 ${isRecorrente ? 'p-5 space-y-4' : 'h-12 flex items-center px-4'}`}>
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col">
                  <Label className={`font-black text-xs uppercase tracking-widest ${isRecorrente ? 'text-green-500' : 'text-zinc-400'}`}>
                    {t('recurringAppointment')}
                  </Label>
                  {isRecorrente && <p className="text-[10px] text-zinc-600 font-bold uppercase mt-0.5">Repetir compromisso</p>}
                </div>
                <Switch
                  checked={isRecorrente}
                  onCheckedChange={setIsRecorrente}
                  className="focus-visible:ring-0 focus:ring-0"
                />
              </div>

              {isRecorrente && (
                <div className="space-y-4 pt-2 border-t border-zinc-800/50 animate-in fade-in duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 block">Frequência</Label>
                      <Select value={tipoRecorrencia || undefined} onValueChange={(v) => setTipoRecorrencia(v as TipoRecorrencia)}>
                        <SelectTrigger className="bg-zinc-900/50 border-zinc-800 h-10 text-white rounded-xl focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-zinc-800">
                          {tiposRecorrencia.map((tipo) => (
                            <SelectItem key={tipo.value} value={tipo.value} className="text-white hover:bg-zinc-900">
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 block">A cada</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max="365"
                          value={intervaloRecorrencia}
                          onChange={(e) => setIntervaloRecorrencia(parseInt(e.target.value) || 1)}
                          className="bg-zinc-900/50 border-zinc-800 text-white h-10 rounded-xl focus:ring-0 font-black text-center"
                        />
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Unidades</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] font-black uppercase tracking-[0.1em] text-zinc-500 mb-2 block">Termina em</Label>
                    <Input
                      type="date"
                      value={dataFimRecorrencia}
                      onChange={(e) => setDataFimRecorrencia(e.target.value)}
                      className="bg-zinc-900/50 border-zinc-800 text-white h-10 rounded-xl focus:ring-0"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Google Calendar Sync */}
            {hasGoogleAuth && (
              <div className="p-5 bg-zinc-900/40 rounded-2xl border border-zinc-800 shadow-sm relative overflow-hidden group hover:bg-zinc-900/60 transition-all">
                <div className={`absolute top-0 left-0 w-1 h-full ${syncWithGoogle ? 'bg-blue-500' : 'bg-zinc-800'} opacity-30 transition-opacity`} />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Label className={`font-black text-xs uppercase tracking-widest ${syncWithGoogle ? 'text-blue-500' : 'text-zinc-400'}`}>
                          Google Calendar
                        </Label>
                        {!canSyncGoogle && <Crown className="w-3 h-3 text-amber-500" />}
                      </div>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase mt-0.5">Sincronização em tempo real</p>
                    </div>
                  </div>
                  <Switch
                    checked={syncWithGoogle}
                    onCheckedChange={(val) => {
                      if (!canSyncGoogle) {
                        setShowUpgradeModal(true);
                        return;
                      }
                      setSyncWithGoogle(val);
                    }}
                    className="focus-visible:ring-0 focus:ring-0"
                  />
                </div>
              </div>
            )}

            {/* Aviso sobre recorrência ao editar */}
            {isEditMode && initialData?.isRecorrente && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/80 leading-relaxed italic">
                  {t('recurringEditWarning')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-4 pt-10 border-t border-zinc-800/50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
            disabled={loading}
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-[2] h-14 rounded-2xl font-black text-sm uppercase tracking-[0.15em] shadow-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] focus:ring-0 focus:outline-none focus-visible:ring-0 bg-green-600 hover:bg-green-700 shadow-green-900/20 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Sincronizando...
              </>
            ) : (
              isEditMode ? t('update') : t('save')
            )}
          </Button>
        </div>
      </form>

      {/* Modal de Upgrade */}
      <UpgradeToPremiumModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        recurso={t('googleCalendarSync')}
        descricao={t('googleSyncPremium')}
      />
    </div>
  );
}
