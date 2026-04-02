import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function PUT() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        await sql`
            UPDATE "Notificacao"
            SET lida = TRUE, "lidaEm" = NOW()
            WHERE "userId" = ${session.user.id} AND lida = FALSE
        `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao marcar todas as notificações como lidas:', error);
        return NextResponse.json({ error: 'Erro ao processar solicitação' }, { status: 500 });
    }
}
