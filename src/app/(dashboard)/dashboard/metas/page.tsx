'use client';

import { ComingSoon } from '@/components/dashboard/ComingSoon';
import { Target } from 'lucide-react';

export default function MetasPage() {
  return (
    <ComingSoon
      icon={Target}
      title="Metas"
      description="Defina, acompanhe e alcance seus objetivos com um sistema inteligente de gerenciamento de metas pessoais e profissionais"
      features={[
        'Definição de metas SMART',
        'Acompanhamento de progresso',
        'Lembretes personalizados',
      ]}
    />
  );
}
