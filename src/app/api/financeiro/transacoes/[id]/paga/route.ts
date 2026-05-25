import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const { id } = await params;
    const userId = session.user.id;
    try {
        const row = await sql`SELECT * FROM "Transacao" WHERE "id"=${id} AND "userId"=${userId}`;
        if (!row.length) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
        const t = row[0] as Record<string, unknown>;
        const novoPaga = !t.paga;
        await sql`UPDATE "Transacao" SET "paga"=${novoPaga},"updatedAt"=NOW() WHERE "id"=${id} AND "userId"=${userId}`;
        return NextResponse.json({ data: { ...t, paga: novoPaga } });
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
