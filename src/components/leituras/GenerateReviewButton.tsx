"use client"

import { useState } from "react"
import { useSession } from '@/lib/auth-mock'
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, Crown } from "lucide-react"
import { toast } from "sonner"
import { UpgradeToPremiumModal } from "@/components/planos/UpgradeToPremiumModal"
import { verificarAcessoRecurso } from "@/lib/planos-helper"
import { RecursoPremium, PlanoUsuario } from "@/types/planos"

interface GenerateReviewButtonProps {
  midiaId: string
  onReviewGenerated: (review: string) => void
  disabled?: boolean
}

export function GenerateReviewButton({
  midiaId,
  onReviewGenerated,
  disabled = false,
}: GenerateReviewButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const { data: session } = useSession()

  const handleGenerate = async () => {
    // Verificar acesso ao recurso
    const plano = (session?.user?.plano as PlanoUsuario) || PlanoUsuario.FREE
    const planoExpiraEm = session?.user?.planoExpiraEm ? new Date(session.user.planoExpiraEm) : undefined

    const acessoRecurso = verificarAcessoRecurso(
      plano,
      planoExpiraEm,
      RecursoPremium.GERAR_RESENHA_IA
    )

    if (!acessoRecurso.temAcesso) {
      setShowUpgradeModal(true)
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ midiaId }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Se for erro 403, mostrar modal de upgrade
        if (response.status === 403) {
          setShowUpgradeModal(true)
          return
        }
        throw new Error(data.error || "Erro ao gerar resenha")
      }

      onReviewGenerated(data.review)
      toast.success("Resenha gerada com sucesso!")
    } catch (error) {
      console.error("Erro ao gerar resenha:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao gerar resenha. Tente novamente."
      )
    } finally {
      setIsGenerating(false)
    }
  }

  // Verifica se o usuário é premium
  const plano = (session?.user?.plano as PlanoUsuario) || PlanoUsuario.FREE
  const planoExpiraEmDate = session?.user?.planoExpiraEm ? new Date(session.user.planoExpiraEm) : undefined
  const acessoRecurso = verificarAcessoRecurso(
    plano,
    planoExpiraEmDate,
    RecursoPremium.GERAR_RESENHA_IA
  )
  const isPremium = acessoRecurso.temAcesso

  return (
    <>
      <div className="relative">
        {/* Coroa indicando recurso premium - aparece apenas para usuários FREE */}
        {!isGenerating && !isPremium && (
          <Crown className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1 z-10" />
        )}

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || disabled}
          variant="default"
          size="sm"
          className="gap-2"
          title={isGenerating ? 'Gerando resenha...' : !isPremium ? 'Premium - Clique para fazer upgrade' : 'Gerar Resenha com IA'}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando resenha...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Gerar Resenha
            </>
          )}
        </Button>
      </div>

      <UpgradeToPremiumModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        recurso="Geração de Resenhas com IA"
        descricao="A geração de resenhas com inteligência artificial está disponível apenas para usuários Premium."
      />
    </>
  )
}
