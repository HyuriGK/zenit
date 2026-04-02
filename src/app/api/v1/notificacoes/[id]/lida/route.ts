import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const result = await sql`
            UPDATE "Notificacao"
            SET lida = TRUE, "lidaEm" = NOW()
            WHERE id = ${id} AND "userId" = ${session.user.id}
            RETURNING id;
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Notificação não encontrada' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        return NextResponse.json({ error: 'Erro ao processar solicitação' }, { status: 500 });
    }
}
