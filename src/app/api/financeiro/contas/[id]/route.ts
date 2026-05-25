import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const { id } = await params;
    const userId = session.user.id;
    try {
        const d = await req.json();
        const rows = await sql`
            UPDATE "ContaBancaria" SET
                "nome"      = COALESCE(${d.nome}, "nome"),
                "tipo"      = COALESCE(${d.tipo}, "tipo"),
                "banco"     = COALESCE(${d.banco ?? null}, "banco"),
                "saldoAtual"= COALESCE(${d.saldoAtual != null ? parseFloat(d.saldoAtual) : null}, "saldoAtual"),
                "ativa"     = COALESCE(${d.ativa ?? null}, "ativa"),
                "cor"       = COALESCE(${d.cor}, "cor"),
                "updatedAt" = NOW()
            WHERE "id" = ${id} AND "userId" = ${userId}
            RETURNING *`;
        if (!rows.length) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
        return NextResponse.json({ data: rows[0] });
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const { id } = await params;
    const userId = session.user.id;
    try {
        await sql`DELETE FROM "ContaBancaria" WHERE "id" = ${id} AND "userId" = ${userId}`;
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
