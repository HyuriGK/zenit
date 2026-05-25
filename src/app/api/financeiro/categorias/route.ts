import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const userId = session.user.id;
    try {
        const rows = await sql`SELECT * FROM "Categoria" WHERE "userId" = ${userId} ORDER BY "nome" ASC`;
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
        const rows = await sql`
            INSERT INTO "Categoria" ("id","nome","tipo","cor","icone","userId","createdAt","updatedAt")
            VALUES (${id},${d.nome},${d.tipo},${d.cor || '#059669'},${d.icone || 'tag'},${userId},NOW(),NOW())
            RETURNING *`;
        return NextResponse.json({ data: rows[0] }, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
