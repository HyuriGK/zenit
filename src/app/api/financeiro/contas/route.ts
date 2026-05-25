import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const userId = session.user.id;
    try {
        const rows = await sql`SELECT * FROM "ContaBancaria" WHERE "userId" = ${userId} ORDER BY "createdAt" ASC`;
        return NextResponse.json({ data: rows });
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const userId = session.user.id;
    try {
        const d = await request.json();
        const id = d.id || crypto.randomUUID();
        const saldo = parseFloat(d.saldoInicial || 0);
        const rows = await sql`
            INSERT INTO "ContaBancaria" ("id","nome","tipo","banco","saldoInicial","saldoAtual","cor","icone","ativa","userId","createdAt","updatedAt")
            VALUES (${id},${d.nome},${d.tipo || 'CORRENTE'},${d.banco || null},${saldo},${parseFloat(d.saldoAtual ?? d.saldoInicial ?? 0)},${d.cor || '#059669'},${d.icone || 'wallet'},${d.ativa !== false},${userId},NOW(),NOW())
            RETURNING *`;
        return NextResponse.json({ data: rows[0] }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
