import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminEmail } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) return NextResponse.json({ error: 'Acesso restrito.' }, { status: 403 });

  const usuarios = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true, role: true, plano: true, createdAt: true,
      logsAcesso: { take: 1, orderBy: { createdAt: 'desc' }, select: { createdAt: true, dispositivo: true } },
    },
  });
  return NextResponse.json(usuarios);
}
