'use client';

import { useState } from 'react';
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
import { Loader2, Eye, EyeOff, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  // Validações - mesmas regras do cadastro
  const senhaMinLength = novaSenha.length >= 8;
  const temMaiuscula = /[A-Z]/.test(novaSenha);
  const temMinuscula = /[a-z]/.test(novaSenha);
  const temNumero = /\d/.test(novaSenha);
  const senhaValida = senhaMinLength && temMaiuscula && temMinuscula && temNumero;
  const senhasMatch = novaSenha === confirmarSenha && confirmarSenha.length > 0;
  const canSubmit = senhaAtual && senhaValida && senhasMatch;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading('Alterando senha...');

    try {
      const response = await fetch('/api/v1/perfil/senha', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Senha alterada com sucesso!', { id: loadingToast });
        handleClose();
      } else {
        toast.error(data.error || 'Erro ao alterar senha', { id: loadingToast });
      }
    } catch {
      toast.error('Erro ao alterar senha. Tente novamente.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarSenha('');
    setShowSenhaAtual(false);
    setShowNovaSenha(false);
    setShowConfirmarSenha(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 flex items-center gap-2">
            <Lock className="w-5 h-5 text-zenit-400" />
            Alterar Senha
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Para sua segurança, insira sua senha atual e defina uma nova senha.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Senha Atual */}
          <div className="space-y-2">
            <Label htmlFor="senhaAtual" className="text-zinc-300">
              Senha Atual
            </Label>
            <div className="relative">
              <Input
                id="senhaAtual"
                type={showSenhaAtual ? 'text' : 'password'}
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Digite sua senha atual"
                className="bg-zinc-950/50 border-zinc-800 focus-visible:ring-zenit-500/50 text-zinc-100 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showSenhaAtual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nova Senha */}
          <div className="space-y-2">
            <Label htmlFor="novaSenha" className="text-zinc-300">
              Nova Senha
            </Label>
            <div className="relative">
              <Input
                id="novaSenha"
                type={showNovaSenha ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Digite sua nova senha"
                className="bg-zinc-950/50 border-zinc-800 focus-visible:ring-zenit-500/50 text-zinc-100 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNovaSenha(!showNovaSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {novaSenha && (
              <div className="space-y-1 mt-2">
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  senhaMinLength ? "text-green-500" : "text-zinc-500"
                )}>
                  {senhaMinLength ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  Mínimo 8 caracteres
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  temMaiuscula ? "text-green-500" : "text-zinc-500"
                )}>
                  {temMaiuscula ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  Uma letra maiúscula
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  temMinuscula ? "text-green-500" : "text-zinc-500"
                )}>
                  {temMinuscula ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  Uma letra minúscula
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  temNumero ? "text-green-500" : "text-zinc-500"
                )}>
                  {temNumero ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  Um número
                </div>
              </div>
            )}
          </div>

          {/* Confirmar Senha */}
          <div className="space-y-2">
            <Label htmlFor="confirmarSenha" className="text-zinc-300">
              Confirmar Nova Senha
            </Label>
            <div className="relative">
              <Input
                id="confirmarSenha"
                type={showConfirmarSenha ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Confirme sua nova senha"
                className="bg-zinc-950/50 border-zinc-800 focus-visible:ring-zenit-500/50 text-zinc-100 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showConfirmarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmarSenha && (
              <div className={cn(
                "flex items-center gap-1 text-xs",
                senhasMatch ? "text-green-500" : "text-red-500"
              )}>
                {senhasMatch ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    Senhas coincidem
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    Senhas não coincidem
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-zinc-400 hover:text-zinc-100"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="bg-white text-black hover:bg-zinc-200"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Alterando...
              </>
            ) : (
              'Alterar Senha'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
