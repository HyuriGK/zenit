import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const body = await request.json();
  const rota = typeof body.rota === 'string' ? body.rota.slice(0, 300) : '';
  if (!rota.startsWith('/dashboard')) return NextResponse.json({ error: 'Rota inválida.' }, { status: 400 });

  const userAgent = request.headers.get('user-agent') || '';
  const dispositivo = /Mobi|Android|iPhone|iPad/i.test(userAgent) ? 'Mobile' : 'Desktop';
  await prisma.logAcesso.create({
    data: {
      userId: session.user.id,
      rota,
      dispositivo,
      detalhes: `Acessou a tela ${rota === '/dashboard' ? 'Dashboard' : rota.replace('/dashboard/', '')}.`,
    },
  });

  return NextResponse.json({ ok: true });
}
