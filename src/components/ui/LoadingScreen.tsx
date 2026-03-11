'use client';

import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ message, className, fullScreen = false }: LoadingScreenProps) {
  return (
    <div className={cn(
      "flex items-center justify-center bg-zinc-950/50",
      fullScreen ? "fixed inset-0 z-50 bg-zinc-950" : "h-full min-h-[400px]",
      className
    )}>
      <div className="text-center">
        <Activity className="w-12 h-12 text-emerald-500 mx-auto mb-6 animate-pulse" />
        <div className="w-48 h-1 bg-zinc-900 border border-zinc-800 mx-auto overflow-hidden relative rounded-full">
          <div className="absolute inset-0 bg-emerald-500/50 animate-[loading-bar_2s_infinite_ease-in-out]"></div>
        </div>
        {message && (
          <p className="mt-4 text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
