# Exemplos de Uso do Sistema de Planos

Este documento contém exemplos práticos de como usar o sistema de planos implementado.

## Script SQL para Testar

### Verificar plano atual do usuário

```sql
SELECT
  email,
  plano,
  plano_expira_em,
  CASE
    WHEN plano_expira_em IS NULL THEN 'Sem expiração'
    WHEN plano_expira_em < NOW() THEN 'Expirado'
    ELSE 'Ativo'
  END as status
FROM users
WHERE email = 'seu@email.com';
```

### Tornar usuário Premium por 30 dias

```sql
UPDATE users
SET
  plano = 'PREMIUM',
  plano_expira_em = NOW() + INTERVAL '30 days',
  updated_at = NOW()
WHERE email = 'seu@email.com';
```

### Tornar usuário Free

```sql
UPDATE users
SET
  plano = 'FREE',
  plano_expira_em = NULL,
  updated_at = NOW()
WHERE email = 'seu@email.com';
```

### Renovar Premium por mais 30 dias

```sql
UPDATE users
SET
  plano_expira_em = NOW() + INTERVAL '30 days',
  updated_at = NOW()
WHERE email = 'seu@email.com'
  AND plano = 'PREMIUM';
```

### Listar todos os usuários Premium

```sql
SELECT
  email,
  name,
  plano,
  plano_expira_em,
  CASE
    WHEN plano_expira_em < NOW() THEN 'Expirado'
    ELSE 'Ativo'
  END as status
FROM users
WHERE plano = 'PREMIUM'
ORDER BY plano_expira_em DESC;
```

### Listar Premium que vão expirar em 7 dias

```sql
SELECT
  email,
  name,
  plano_expira_em,
  plano_expira_em - NOW() as tempo_restante
FROM users
WHERE plano = 'PREMIUM'
  AND plano_expira_em BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY plano_expira_em ASC;
```

## Exemplos de Código

### Exemplo 1: Botão com verificação de plano

```typescript
'use client';

import { useState } from 'react';
import { usePlano } from '@/hooks/usePlano';
import { Button } from '@/components/ui/button';
import { UpgradeToPremiumModal } from '@/components/planos/UpgradeToPremiumModal';
import { RecursoPremium } from '@/types/planos';

export function MeuBotaoPremium() {
  const { temAcessoARecurso } = usePlano();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleClick = () => {
    // Verificar se tem acesso ao recurso
    if (!temAcessoARecurso(RecursoPremium.GERAR_RESENHA_IA)) {
      setShowUpgrade(true);
      return;
    }

    // Executar funcionalidade premium
    console.log('Executando funcionalidade premium!');
  };

  return (
    <>
      <Button onClick={handleClick}>
        Funcionalidade Premium
      </Button>

      <UpgradeToPremiumModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        recurso="Minha Funcionalidade"
        descricao="Esta funcionalidade está disponível apenas para usuários Premium."
      />
    </>
  );
}
```

### Exemplo 2: Rota de API com verificação

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { verificarAcessoRecurso } from '@/lib/planos-helper';
import { RecursoPremium } from '@/types/planos';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  }

  // Verificar acesso ao recurso
  const acessoRecurso = verificarAcessoRecurso(
    user.plano,
    user.planoExpiraEm,
    RecursoPremium.GERAR_RESENHA_IA
  );

  if (!acessoRecurso.temAcesso) {
    return NextResponse.json(
      {
        error: acessoRecurso.motivo,
        planoAtual: acessoRecurso.planoEfetivo,
      },
      { status: 403 }
    );
  }

  // Executar lógica da API
  // ...

  return NextResponse.json({ success: true });
}
```

### Exemplo 3: Componente condicional baseado em plano

```typescript
'use client';

import { usePlano } from '@/hooks/usePlano';
import { Crown } from 'lucide-react';

export function MeuComponente() {
  const { ehPremium, ehFree } = usePlano();

  return (
    <div>
      {ehPremium && (
        <div className="flex items-center gap-2 text-purple-400">
          <Crown className="w-4 h-4" />
          <span>Você é Premium!</span>
        </div>
      )}

      {ehFree && (
        <div className="text-gray-400">
          Você está usando o plano gratuito
        </div>
      )}
    </div>
  );
}
```

### Exemplo 4: Badge de plano

```typescript
'use client';

import { usePlano } from '@/hooks/usePlano';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

export function PlanoBadge() {
  const { plano, ehPremium } = usePlano();

  if (ehPremium) {
    return (
      <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <Crown className="w-3 h-3 mr-1" />
        Premium
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-gray-400">
      Free
    </Badge>
  );
}
```

### Exemplo 5: Seção bloqueada para Free

```typescript
'use client';

import { usePlano } from '@/hooks/usePlano';
import { Button } from '@/components/ui/button';
import { Lock, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SecaoPremium() {
  const { ehPremium } = usePlano();
  const router = useRouter();

  if (!ehPremium) {
    return (
      <div className="relative">
        {/* Conteúdo bloqueado com blur */}
        <div className="blur-sm pointer-events-none select-none">
          <div className="p-6 bg-zinc-800 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Estatísticas Avançadas</h3>
            <div className="space-y-4">
              <div>Gráfico 1...</div>
              <div>Gráfico 2...</div>
            </div>
          </div>
        </div>

        {/* Overlay de upgrade */}
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 rounded-lg">
          <div className="text-center space-y-4 p-6">
            <Lock className="w-12 h-12 mx-auto text-purple-400" />
            <h3 className="text-xl font-bold text-white">Recurso Premium</h3>
            <p className="text-gray-300">
              Desbloqueie estatísticas avançadas com o plano Premium
            </p>
            <Button
              onClick={() => router.push('/premium')}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <Crown className="w-4 h-4 mr-2" />
              Fazer Upgrade
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Conteúdo normal para Premium
  return (
    <div className="p-6 bg-zinc-800 rounded-lg">
      <h3 className="text-xl font-bold mb-4">Estatísticas Avançadas</h3>
      <div className="space-y-4">
        {/* Conteúdo real aqui */}
      </div>
    </div>
  );
}
```

## Cenários de Teste

### Cenário 1: Usuário Free tenta gerar resenha

1. Fazer login com usuário Free
2. Ir para página de um livro/filme
3. Clicar em "Gerar Resenha"
4. **Resultado esperado**: Modal de upgrade aparece

### Cenário 2: Usuário Premium gera resenha

1. Tornar usuário Premium no banco
2. Fazer login
3. Ir para página de um livro/filme
4. Clicar em "Gerar Resenha"
5. **Resultado esperado**: Resenha é gerada normalmente

### Cenário 3: Plano Premium expira

1. Criar usuário Premium com data de expiração ontem
2. Fazer login
3. Tentar usar recurso premium
4. **Resultado esperado**: Sistema trata como Free e bloqueia acesso

### Cenário 4: Free tenta sincronizar com Google

1. Fazer login com usuário Free
2. Ir para agenda
3. Criar compromisso
4. **Resultado esperado**: Opção "Enviar para Google Agenda" está desabilitada com ícone de Premium

### Cenário 5: Premium sincroniza com Google

1. Tornar usuário Premium no banco
2. Fazer login
3. Conectar conta Google
4. Criar compromisso
5. Marcar "Enviar para Google Agenda"
6. **Resultado esperado**: Compromisso é criado e sincronizado com Google Calendar

## Logs e Debug

### Verificar logs de acesso bloqueado

Os logs aparecem no console do servidor quando um usuário Free tenta acessar recurso premium:

```
❌ Usuário sem acesso ao recurso (Plano: FREE)
```

### Verificar logs de acesso permitido

```
✅ Acesso ao recurso verificado (Plano: PREMIUM)
```

### Debug do plano no frontend

```typescript
const planoInfo = usePlano();
console.log('Informações do plano:', planoInfo);

// Output:
// {
//   plano: 'PREMIUM',
//   planoOriginal: 'PREMIUM',
//   planoExpiraEm: Date,
//   ehPremium: true,
//   ehFree: false,
//   podeGerarResenhaIA: true,
//   podeSincronizarGoogleCalendar: true
// }
```
