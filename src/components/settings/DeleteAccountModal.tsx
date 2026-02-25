'use client';

import { useState, useMemo, useEffect } from 'react';
import { signOut } from '@/lib/auth-mock';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  AlertTriangle,
  Heart,
  Gift,
  Star,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BookOpen,
  Target,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CANCELLATION_REASONS = [
  { id: 'not_using', label: 'Não estou usando o suficiente', icon: Calendar },
  { id: 'too_expensive', label: 'Achei caro demais', icon: TrendingUp },
  { id: 'missing_features', label: 'Faltam funcionalidades que preciso', icon: Target },
  { id: 'found_alternative', label: 'Encontrei outra alternativa', icon: Star },
  { id: 'too_complex', label: 'Achei muito complexo de usar', icon: BookOpen },
  { id: 'temporary', label: 'É temporário, pretendo voltar', icon: Heart },
  { id: 'other', label: 'Outro motivo', icon: Sparkles },
];

const RANDOM_PHRASES = [
  'sol azul',
  'dia feliz',
  'mar calmo',
  'paz sempre',
  'vida boa',
  'luz clara',
  'amor puro',
  'alma livre',
  'bem estar',
  'bom dia',
  'noite linda',
  'verde vivo',
  'ar fresco',
  'rio azul',
  'lua cheia',
];

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [randomPhrase, setRandomPhrase] = useState('');
  const [randomPhraseInput, setRandomPhraseInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gerar frase aleatória quando abrir o modal
  useEffect(() => {
    if (isOpen) {
      const phrase = RANDOM_PHRASES[Math.floor(Math.random() * RANDOM_PHRASES.length)];
      setRandomPhrase(phrase);
    }
  }, [isOpen]);

  const confirmText = 'Eu desejo excluir minha conta';
  const confirmTextMatches = confirmPhrase === confirmText;
  const randomPhraseMatches = randomPhraseInput.toLowerCase() === randomPhrase.toLowerCase();
  const canDelete = confirmTextMatches && randomPhraseMatches;

  const handleDelete = async () => {
    if (!canDelete) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading('Excluindo sua conta...');

    try {
      const response = await fetch('/api/v1/perfil/excluir', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: selectedReason }),
      });

      if (response.ok) {
        toast.success('Conta excluída com sucesso. Sentiremos sua falta!', { id: loadingToast });
        await signOut({ callbackUrl: '/' });
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao excluir conta', { id: loadingToast });
      }
    } catch {
      toast.error('Erro ao excluir conta. Tente novamente.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedReason(null);
    setConfirmPhrase('');
    setRandomPhraseInput('');
    onClose();
  };

  const goToStep2 = () => {
    if (selectedReason) {
      setStep(2);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-zinc-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            {step === 1 ? 'Tem certeza que quer nos deixar?' : 'Confirmação Final'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-6 overflow-y-auto flex-1 pr-2">
            {/* Mensagem emocional */}
            <div className="bg-gradient-to-br from-zenit-500/10 to-green-500/10 border border-zenit-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-zenit-500/20 rounded-full">
                  <Heart className="w-5 h-5 text-zenit-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-zinc-100 mb-1">
                    Sentiremos sua falta!
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Você faz parte da nossa comunidade e adoraríamos ajudá-lo a aproveitar
                    melhor a plataforma. Antes de ir, nos conte o motivo?
                  </p>
                </div>
              </div>
            </div>

            {/* O que você vai perder */}
            <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-500" />
                Ao excluir sua conta, você perderá:
              </h4>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Todos os seus compromissos e agenda organizados
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Seu histórico financeiro completo
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Todas as suas anotações e cursos salvos
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Suas leituras, citações e resenhas
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Todo o seu progresso de hábitos
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Planejamento de viagens e documentos
                </li>
              </ul>
              <p className="mt-3 text-xs text-amber-500/80 font-medium">
                Esta ação é irreversível e não poderá ser desfeita!
              </p>
            </div>

            {/* Motivos */}
            <div>
              <Label className="text-zinc-300 text-sm mb-3 block">
                Por que você está nos deixando?
              </Label>
              <div className="grid gap-2">
                {CANCELLATION_REASONS.map((reason) => {
                  const Icon = reason.icon;
                  const isSelected = selectedReason === reason.id;
                  return (
                    <button
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                        isSelected
                          ? "border-zenit-500 bg-zenit-500/10 text-zinc-100"
                          : "border-zinc-800 bg-zinc-950/30 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/50"
                      )}
                    >
                      <Icon className={cn("w-4 h-4", isSelected ? "text-zenit-400" : "text-zinc-500")} />
                      <span className="text-sm">{reason.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleClose}
                className="bg-green-600 text-white hover:bg-green-500"
              >
                Mudei de ideia
              </Button>
              <Button
                onClick={goToStep2}
                disabled={!selectedReason}
                variant="ghost"
                className="text-zinc-400 hover:text-zinc-100"
              >
                Continuar
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-6 overflow-y-auto flex-1 pr-2">
            <DialogDescription className="text-zinc-400">
              Para confirmar a exclusão permanente da sua conta, digite as frases abaixo
              exatamente como mostrado.
            </DialogDescription>

            {/* Última chance */}
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm text-zinc-200">
                    <strong>Espere!</strong> Que tal conversar com nosso suporte antes?
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Podemos ajudar a resolver qualquer problema que você esteja enfrentando.
                  </p>
                </div>
              </div>
            </div>

            {/* Confirmação 1 */}
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">
                Digite: <span className="text-red-400 font-mono">{confirmText}</span>
              </Label>
              <Input
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value)}
                placeholder="Digite a frase acima"
                className={cn(
                  "bg-zinc-950/50 border-zinc-800 focus-visible:ring-red-500/50 text-zinc-100 font-mono",
                  confirmTextMatches && "border-green-500/50"
                )}
              />
            </div>

            {/* Confirmação 2 - Frase aleatória */}
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">
                Digite também: <span className="text-red-400 font-mono">{randomPhrase}</span>
              </Label>
              <Input
                value={randomPhraseInput}
                onChange={(e) => setRandomPhraseInput(e.target.value)}
                placeholder="Digite a frase acima"
                className={cn(
                  "bg-zinc-950/50 border-zinc-800 focus-visible:ring-red-500/50 text-zinc-100 font-mono",
                  randomPhraseMatches && "border-green-500/50"
                )}
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="text-zinc-400 hover:text-zinc-100"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
              <Button
                onClick={handleClose}
                disabled={isSubmitting}
                className="bg-green-600 text-white hover:bg-green-500"
              >
                Quero ficar!
              </Button>
              <Button
                onClick={handleDelete}
                disabled={!canDelete || isSubmitting}
                variant="ghost"
                className={cn(
                  "text-zinc-500",
                  canDelete && "text-red-400 hover:text-red-300 hover:bg-red-950/30"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  'Excluir conta'
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
