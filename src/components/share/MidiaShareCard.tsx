import { Midia } from '@/types/midia'
import { StarRating } from '@/components/ui/star-rating'

interface Props {
  midia: Midia
  format?: 'POST' | 'STORY'
}

export function MidiaShareCard({ midia, format = 'POST' }: Props) {
  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('/') || url.startsWith('data:')) return url;
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }

  const isStory = format === 'STORY';

  return (
    <div
      id="zenit-share-card"
      className={`
        w-[1080px] relative overflow-hidden font-sans
        ${isStory ? 'h-[1920px] pt-32 pb-40' : 'h-[1350px] py-20'}
      `}
    >
      {/* Background escuro cinza */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950" />

      {/* Textura de fundo sutil */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Brilho superior */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-green-500/10 rounded-full blur-[120px]" />

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col h-full items-center justify-between px-16">

        {/* Seção da Mídia */}
        <div className={`flex flex-col items-center w-full ${isStory ? 'space-y-12' : 'space-y-8'}`}>

          {/* Capa */}
          <div className={`
            relative group transition-all duration-500
            ${isStory ? 'w-[560px]' : 'w-[480px]'}
          `}>
            {/* Shadow layer */}
            <div className="absolute -inset-4 bg-gradient-to-b from-green-500/30 to-blue-500/30 rounded-[2.5rem] blur-2xl opacity-60" />

            <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/10">
              {midia.capa ? (
                <img
                  src={getImageUrl(midia.capa)}
                  alt={midia.titulo}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <span className="text-slate-500 text-4xl font-semibold">Sem Capa</span>
                </div>
              )}
            </div>
          </div>

          {/* Info Container */}
          <div className={`flex flex-col items-center max-w-4xl w-full ${isStory ? 'space-y-10' : 'space-y-6'}`}>

            {/* Título */}
            <h1 className={`
              font-bold text-center text-white leading-tight tracking-tight
              ${isStory ? 'text-[4.5rem]' : 'text-[3.75rem]'}
            `}>
              {midia.titulo}
            </h1>

            {/* Autor */}
            <div className="flex items-center gap-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-green-400/50" />
              <p className={`
                text-slate-300 font-medium
                ${isStory ? 'text-[2rem]' : 'text-[1.75rem]'}
              `}>
                {midia.tipo === 'LIVRO' ? midia.autor : midia.diretor}
              </p>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-green-400/50" />
            </div>

            {/* Rating */}
            <div className={`flex flex-col items-center gap-4 ${isStory ? 'py-10' : 'py-6'}`}>
              <div className={`transform ${isStory ? 'scale-[3.2]' : 'scale-[2.8]'}`}>
                <StarRating value={midia.nota || 0} readonly size="lg" />
              </div>
            </div>

          </div>
        </div>

        {/* Branding */}
        <div className={`flex flex-col items-center ${isStory ? 'space-y-10' : 'space-y-6'}`}>

          {/* Divider */}
          <div className="flex items-center gap-4 w-full max-w-md">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
            <div className="w-2 h-2 rounded-full bg-green-400/60" />
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
          </div>

          {/* Logo */}
          <div className="flex flex-col items-center">
            <h2 className={`
              font-extrabold tracking-tight
              ${isStory ? 'text-[6rem] mb-2' : 'text-[5rem] mb-1'}
            `}>
              <span className="bg-gradient-to-r from-green-400 via-green-300 to-blue-400 bg-clip-text text-transparent">
                Zenit
              </span>
            </h2>
            <p className={`
              text-slate-400 font-medium tracking-wide
              ${isStory ? 'text-[1.5rem]' : 'text-[1.25rem]'}
            `}>
              Organize sua vida, simplifique seu dia
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}