'use client';

import { ComingSoon } from '@/components/dashboard/ComingSoon';
import { Dumbbell } from 'lucide-react';

export default function TreinosPage() {
  return (
    <ComingSoon
      icon={Dumbbell}
      title="Treinos"
      description="Monte e acompanhe suas rotinas de exercícios com planos personalizados e registro de evolução física"
      features={[
        'Planos de treino personalizados',
        'Registro de séries e repetições',
        'Histórico de evolução',
      ]}
    />
  );
}
