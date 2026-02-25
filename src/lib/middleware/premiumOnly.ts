import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { PlanoUsuario } from '@/types/planos';

/**
 * Middleware para verificar se o usuário tem plano Premium ativo
 * Retorna erro 403 se o usuário não for Premium ou se o plano estiver expirado
 */
export async function requirePremium(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      plano: true,
      planoExpiraEm: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Usuário não encontrado' },
      { status: 404 }
    );
  }

  // Verificar se o usuário é Premium
  if (user.plano !== PlanoUsuario.PREMIUM) {
    return NextResponse.json(
      {
        error: 'Recurso Premium',
        message: 'Este recurso está disponível apenas para usuários Premium.',
        requiresPremium: true,
      },
      { status: 403 }
    );
  }

  // Verificar se o plano está expirado
  if (user.planoExpiraEm && new Date() > new Date(user.planoExpiraEm)) {
    return NextResponse.json(
      {
        error: 'Plano expirado',
        message: 'Seu plano Premium expirou. Renove para continuar usando este recurso.',
        requiresPremium: true,
      },
      { status: 403 }
    );
  }

  // Retornar o userId para uso posterior
  return { userId: user.id };
}
