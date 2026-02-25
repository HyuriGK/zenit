import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const cursos = await sql`
            SELECT 
                c.*,
                (SELECT COUNT(*) FROM "Modulo" m WHERE m."cursoId" = c.id) as modulos_count,
                (SELECT COUNT(*) FROM "Anotacao" a WHERE a."cursoId" = c.id) as anotacoes_count
            FROM "Curso" c
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
        const data = await request.json();
        const id = data.id || crypto.randomUUID();
        const nome = data.nome || 'Novo Caderno';
        const descricao = data.descricao || null;
        const cor = data.cor || '#10B981';
        const icone = data.icone || 'book-open';

        // Mock User
        const userId = '12345678-user-mock-abcd';

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
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 });
        }

        // OnDelete Cascade do DB vai apagar modulos e anotações vinculados automaticamente se a migration tiver criado as fks assim.
        // Prisma schema says: `onDelete: Cascade` for modulos, anotacoes, and from curso to modulo/anotacoes. 
        // We will just delete the Curso.
        await sql`
            DELETE FROM "Curso" WHERE id = ${id}
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
