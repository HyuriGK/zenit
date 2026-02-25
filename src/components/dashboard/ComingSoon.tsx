'use client';

import { LucideIcon } from 'lucide-react';

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  features?: string[];
}

export function ComingSoon({ icon: Icon, title, description, features }: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-8 animate-fade-in">
      <div className="max-w-4xl w-full">

        {/* Card Principal */}
        <div className="relative overflow-hidden rounded-3xl animate-slide-up">
          {/* Background com gradiente */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-slate-900 to-blue-900/20" />

          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
          </div>

          {/* Glow effects */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-green-500/20 rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[200px] bg-blue-500/20 rounded-full blur-[80px] animate-pulse-slow" />

          {/* Conteúdo */}
          <div className="relative z-10 p-12 md:p-16 text-center">

            {/* Ícone */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/30 mb-8 animate-scale-in">
              <Icon className="w-12 h-12 text-green-400" strokeWidth={1.5} />
            </div>

            {/* Badge Em Breve */}
            <div className="inline-block mb-6 animate-fade-in-delay-1">
              <div className="px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30">
                <span className="text-sm font-semibold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  Em Breve
                </span>
              </div>
            </div>

            {/* Título */}
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in-delay-2">
              {title}
            </h1>

            {/* Descrição */}
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-12 animate-fade-in-delay-3">
              {description}
            </p>

            {/* Features (se houver) */}
            {features && features.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto animate-fade-in-delay-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                    style={{ animationDelay: `${0.1 * index}s` }}
                  >
                    <p className="text-sm text-slate-300">{feature}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Mensagem de rodapé */}
            <div className="mt-12 pt-8 border-t border-white/10 animate-fade-in-delay-5">
              <p className="text-slate-400 text-sm">
                Estamos trabalhando duro para trazer essa funcionalidade para você
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>

          </div>
        </div>

        {/* Cards de Info Extras */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 animate-fade-in-delay-6">
          {/* Premium Feature */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <span className="text-yellow-500 text-xl">👑</span>
              </div>
              <h3 className="font-semibold text-white">Recurso Premium</h3>
            </div>
            <p className="text-sm text-slate-300">
              Esta funcionalidade estará disponível para usuários premium com recursos exclusivos
            </p>
          </div>

          {/* Notificação */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-green-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 text-xl">🔔</span>
              </div>
              <h3 className="font-semibold text-white">Seja Notificado</h3>
            </div>
            <p className="text-sm text-slate-300">
              Você será notificado quando esta funcionalidade for lançada
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
