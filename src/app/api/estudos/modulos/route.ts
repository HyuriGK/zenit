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
        const userId = session.user.id;

        const { searchParams } = new URL(request.url);
        const cursoId = searchParams.get('cursoId');

        if (!cursoId) {
            return NextResponse.json({ error: 'cursoId é obrigatório' }, { status: 400 });
        }

        const modulos = await sql`
            SELECT m.* FROM "Modulo" m
            JOIN "Curso" c ON m."cursoId" = c.id
            WHERE m."cursoId" = ${cursoId} AND c."userId" = ${userId}
            ORDER BY m."ordem" ASC
        `;

        return NextResponse.json({ data: modulos });
    } catch (error) {
        console.error('Erro ao buscar módulos:', error);
        return NextResponse.json(
            { error: 'Falha ao buscar módulos.' },
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
        const nome = data.nome || 'Novo Módulo';
        const descricao = data.descricao || null;
        const ordem = typeof data.ordem === 'number' ? data.ordem : 0;
        const cursoId = data.cursoId;

        if (!cursoId) {
            return NextResponse.json({ error: 'cursoId é obrigatório' }, { status: 400 });
        }

        // Verificar se o curso pertence ao usuário
        const cursoResult = await sql`
            SELECT id FROM "Curso" WHERE id = ${cursoId} AND "userId" = ${userId}
        `;

        if (cursoResult.length === 0) {
            return NextResponse.json({ error: 'Curso não encontrado ou não pertence ao usuário' }, { status: 403 });
        }

        const result = await sql`
            INSERT INTO "Modulo" (
                id, "nome", "descricao", "ordem", "cursoId", "updatedAt"
            ) VALUES (
                ${id}, ${nome}, ${descricao}, ${ordem}, ${cursoId}, NOW()
            )
            RETURNING *;
        `;

        return NextResponse.json({ data: result[0] }, { status: 201 });
    } catch (error) {
        console.error('Erro ao criar módulo:', error);
        return NextResponse.json(
            { error: 'Erro ao criar módulo', details: (error as Error).message },
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

        // Deletar apenas se o modulo pertencer a um curso do usuário
        await sql`
            DELETE FROM "Modulo"
            WHERE id = ${id} AND "cursoId" IN (
                SELECT id FROM "Curso" WHERE "userId" = ${userId}
            )
        `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao excluir módulo:', error);
        return NextResponse.json(
            { error: 'Falha ao excluir módulo.' },
            { status: 500 }
        );
    }
}
