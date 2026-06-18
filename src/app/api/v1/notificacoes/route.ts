import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');

        const notificacoes = await sql`
            SELECT id, tipo, titulo, mensagem, dados, lida, "lidaEm", "createdAt"
            FROM "Notificacao"
            WHERE "userId" = ${session.user.id}
              AND tipo IN ('CONQUISTA', 'SISTEMA')
            ORDER BY "createdAt" DESC
            LIMIT ${limit}
        `;

        return NextResponse.json({ data: notificacoes });
    } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 });
    }
}
