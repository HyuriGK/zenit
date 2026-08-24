import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ADMIN_EMAIL, isAdminEmail } from '@/lib/admin';

async function admin() {
  const session = await auth();
  return isAdminEmail(session?.user?.email);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await admin()) return NextResponse.json({ error: 'Acesso restrito.' }, { status: 403 });
  const { id } = await params;
  const { action, role } = await request.json();
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
  if (user.email?.toLowerCase() === ADMIN_EMAIL && action !== 'logs') return NextResponse.json({ error: 'A conta administrativa principal não pode ser alterada.' }, { status: 400 });
  if (action === 'toggle-block') await prisma.user.update({ where: { id }, data: { ativo: !user.ativo } });
  if (action === 'role' && (role === 'ADMIN' || role === 'OPERADOR')) await prisma.user.update({ where: { id }, data: { role } });
  if (action === 'force-logout') await prisma.session.deleteMany({ where: { userId: id } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await admin()) return NextResponse.json({ error: 'Acesso restrito.' }, { status: 403 });
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.email?.toLowerCase() === ADMIN_EMAIL) return NextResponse.json({ error: 'Esta conta não pode ser excluída.' }, { status: 400 });
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
