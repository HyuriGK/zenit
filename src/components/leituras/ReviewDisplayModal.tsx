"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Check, X, Save } from "lucide-react"
import { db } from "@/lib/dexie"
import { toast } from "sonner"

interface ReviewDisplayModalProps {
  review: string
  midiaId: string
  onClose: () => void
  onSave?: () => void
  open: boolean
}

export function ReviewDisplayModal({
  review: initialReview,
  midiaId,
  onClose,
  onSave,
  open,
}: ReviewDisplayModalProps) {
  const [review, setReview] = useState(initialReview)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(review)
      setCopied(true)
      toast.success("Resenha copiada para a área de transferência!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Erro ao copiar resenha")
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await db.midias.update(midiaId, { resenhaGeradaIA: review } as any);

      toast.success("Resenha salva com sucesso!")
      onSave?.()
      onClose()
    } catch (error) {
      console.error("Erro ao salvar resenha:", error)
      toast.error("Erro ao salvar resenha. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl w-[95vw] max-h-[85vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg md:text-xl flex items-center gap-2">
            <span className="hidden xs:inline">Resenha Gerada por IA</span>
            <span className="xs:hidden">Resenha IA</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 py-3 sm:py-4">
          <Textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="min-h-[300px] sm:min-h-112.5 font-serif text-sm sm:text-base leading-relaxed bg-zinc-800/50 border-zinc-700 text-white resize-none focus-visible:ring-green-600"
            placeholder="Sua resenha..."
          />
          <p className="text-xs sm:text-sm text-zinc-400 mt-2">
            Você pode editar a resenha antes de salvar ou copiar.
          </p>
        </div>

        <DialogFooter className="gap-2 border-t border-zinc-800 pt-3 sm:pt-4 flex-col sm:flex-row">
          <Button
            variant="default"
            onClick={onClose}
            className="border-zinc-700 hover:bg-zinc-800 w-full sm:w-auto text-sm order-3 sm:order-1"
          >
            <X className="mr-2 h-4 w-4" />
            Fechar
          </Button>

          <Button
            variant="default"
            onClick={handleCopy}
            className="border-zinc-700 hover:bg-zinc-800 w-full sm:w-auto text-sm order-2 sm:order-2"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </>
            )}
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-sm order-1 sm:order-3"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
