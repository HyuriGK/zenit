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
        const userId = session.user.id;

        const cursos = await sql`
            SELECT 
                c.*,
                (SELECT COUNT(*) FROM "Modulo" m WHERE m."cursoId" = c.id) as modulos_count,
                (SELECT COUNT(*) FROM "Anotacao" a WHERE a."cursoId" = c.id) as anotacoes_count
            FROM "Curso" c
            WHERE c."userId" = ${userId}
            ORDER BY c."createdAt" DESC
        `;

        // Formatar para o frontend (que espera _count.modulos e _count.anotacoes)
        const formatados = cursos.map(c => ({
            ...c,
            _count: {
                modulos: Number(c.modulos_count || 0),
                anotacoes: Number(c.anotacoes_count || 0)
            }
        }));

        return NextResponse.json({ data: formatados });
    } catch (error) {
        console.error('Erro ao buscar cursos:', error);
        return NextResponse.json(
            { error: 'Falha ao buscar cursos.' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }
        const userId = session.user.id;

        const data = await request.json();
        const id = data.id || crypto.randomUUID();
        const nome = data.nome || 'Novo Caderno';
        const descricao = data.descricao || null;
        const cor = data.cor || '#10B981';
        const icone = data.icone || 'book-open';

        const result = await sql`
            INSERT INTO "Curso" (
                id, "nome", "descricao", "cor", "icone", "userId", "updatedAt"
            ) VALUES (
                ${id}, ${nome}, ${descricao}, ${cor}, ${icone}, ${userId}, NOW()
            )
            RETURNING *;
        `;

        return NextResponse.json({ data: result[0] }, { status: 201 });
    } catch (error) {
        console.error('Erro ao criar curso:', error);
        return NextResponse.json(
            { error: 'Erro ao criar curso', details: (error as Error).message },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }
        const userId = session.user.id;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 });
        }

        // Verificar se o curso pertence ao usuário antes de deletar
        await sql`
            DELETE FROM "Curso" 
            WHERE id = ${id} AND "userId" = ${userId}
        `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao excluir curso:', error);
        return NextResponse.json(
            { error: 'Falha ao excluir curso.' },
            { status: 500 }
        );
    }
}
