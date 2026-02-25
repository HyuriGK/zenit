'use client'

import { useState, useRef } from 'react'
import { toPng } from 'html-to-image'
import { Download, Loader2, Share2, X, Smartphone, LayoutGrid } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Midia } from '@/types/midia'
import { MidiaShareCard } from './MidiaShareCard'

interface Props {
  midia: Midia
  open: boolean
  onClose: () => void
}

type Format = 'POST' | 'STORY'

export function ShareMidiaModal({ midia, open, onClose }: Props) {
  const [generating, setGenerating] = useState(false)
  const [format, setFormat] = useState<Format>('POST')

  const fullSizeRef = useRef<HTMLDivElement>(null)

  const handleDownload = async () => {
    if (!fullSizeRef.current) return

    try {
      setGenerating(true)

      const dataUrl = await toPng(fullSizeRef.current, {
        quality: 1.0,
        pixelRatio: 1,
        cacheBust: true,
      })

      const link = document.createElement('a')
      link.download = `zenit-${format.toLowerCase()}-${midia.titulo.toLowerCase().replace(/\s+/g, '-')}.png`
      link.href = dataUrl
      link.click()

      onClose()
    } catch (err) {
      console.error('Erro ao gerar imagem:', err)
      alert('Erro ao gerar a imagem. Tente novamente.')
    } finally {
      setGenerating(false)
    }
  }

  // Lógica de Escala para a Prévia caber no Modal
  // Post: Scale 0.315 (Largura ~340px, Altura ~425px)
  // Story: Scale 0.26 (Largura ~280px, Altura ~500px) -> Reduzido para caber melhor na tela sem cortar
  const scale = format === 'POST' ? 0.315 : 0.26;
  const previewWidth = 1080 * scale;
  const previewHeight = (format === 'POST' ? 1350 : 1920) * scale;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-2xl w-[95vw] max-h-[95vh] overflow-y-auto flex flex-col p-4 sm:p-6">
          <DialogHeader className="space-y-3 sm:space-y-4">
            <div>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                Compartilhar
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-xs sm:text-sm">
                Escolha o formato e compartilhe.
              </DialogDescription>
            </div>

            {/* SELETOR DE FORMATO (ABAS) */}
            <div className="flex p-1 bg-zinc-950 rounded-lg border border-zinc-800">
              <button
                onClick={() => setFormat('POST')}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all ${format === 'POST'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                <LayoutGrid className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Post (4:5)</span>
                <span className="xs:hidden">Post</span>
              </button>
              <button
                onClick={() => setFormat('STORY')}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all ${format === 'STORY'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Story (9:16)</span>
                <span className="xs:hidden">Story</span>
              </button>
            </div>
          </DialogHeader>

          {/* ÁREA DE PRÉVIA (PREVIEW) */}
          {/* Removido overflow-hidden para não cortar a sombra ou bordas */}
          <div className="flex-1 flex items-center justify-center py-3 sm:py-4 my-2 min-h-[350px] sm:min-h-[450px]">
            <div
              className="relative transition-all duration-300"
              style={{
                width: `${previewWidth}px`,
                height: `${previewHeight}px`
              }}
            >
              <div
                className="origin-top-left transform transition-transform duration-300"
                style={{ transform: `scale(${scale})` }}
              >
                <MidiaShareCard midia={midia} format={format} />
              </div>
            </div>
          </div>

          {/* RODAPÉ */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-zinc-800">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 w-full sm:w-auto text-sm"
            >
              <X className="w-4 h-4 mr-2" />
              Fechar
            </Button>

            <Button
              onClick={handleDownload}
              disabled={generating}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto sm:min-w-[140px] text-sm"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Salvar imagem
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* RENDERIZAÇÃO OCULTA (OFF-SCREEN) - Mantém qualidade máxima */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
        <div ref={fullSizeRef}>
          <MidiaShareCard midia={midia} format={format} />
        </div>
      </div>
    </>
  )
}