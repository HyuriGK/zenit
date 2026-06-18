import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const count = await sql`
            SELECT COUNT(*) FROM "Notificacao"
            WHERE "userId" = ${session.user.id}
              AND lida = FALSE
              AND tipo IN ('CONQUISTA', 'SISTEMA')
        `;

        return NextResponse.json({ count: parseInt(count[0].count) });
    } catch (error) {
        console.error('Erro ao buscar contagem de notificações não lidas:', error);
        return NextResponse.json({ error: 'Erro ao buscar contagem' }, { status: 500 });
    }
}
