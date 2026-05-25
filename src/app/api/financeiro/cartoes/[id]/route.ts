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
            UPDATE "Cartao" SET
                "nome"          = COALESCE(${d.nome}, "nome"),
                "bandeira"      = COALESCE(${d.bandeira ?? null}, "bandeira"),
                "ultimosDigitos"= COALESCE(${d.ultimosDigitos ?? null}, "ultimosDigitos"),
                "limite"        = COALESCE(${d.limite != null ? parseFloat(d.limite) : null}, "limite"),
                "diaVencimento" = COALESCE(${d.diaVencimento != null ? parseInt(d.diaVencimento) : null}, "diaVencimento"),
                "diaFechamento" = COALESCE(${d.diaFechamento != null ? parseInt(d.diaFechamento) : null}, "diaFechamento"),
                "ativo"         = COALESCE(${d.ativo ?? null}, "ativo"),
                "cor"           = COALESCE(${d.cor}, "cor"),
                "updatedAt"     = NOW()
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
        await sql`DELETE FROM "Cartao" WHERE "id" = ${id} AND "userId" = ${userId}`;
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
