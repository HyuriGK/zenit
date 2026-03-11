import { Activity } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 flex items-center justify-center p-6">
      <div className="text-center font-minecraft">
        <Activity className="w-12 h-12 text-emerald-500 mx-auto mb-6 animate-pulse" />
        <div className="w-48 h-2 bg-zinc-900 border border-zinc-800 mx-auto overflow-hidden relative">
          <div className="absolute inset-0 bg-emerald-500/50 animate-[loading-bar_2s_infinite_ease-in-out]"></div>
        </div>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-zinc-500 animate-pulse">
          Carregando...
        </p>
      </div>
    </div>
  );
}
