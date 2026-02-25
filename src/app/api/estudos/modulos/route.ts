import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const cursoId = searchParams.get('cursoId');

        if (!cursoId) {
            return NextResponse.json({ error: 'cursoId é obrigatório' }, { status: 400 });
        }

        const modulos = await sql`
            SELECT * FROM "Modulo"
            WHERE "cursoId" = ${cursoId}
            ORDER BY "ordem" ASC
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
        const data = await request.json();
        const id = data.id || crypto.randomUUID();
        const nome = data.nome || 'Novo Módulo';
        const descricao = data.descricao || null;
        const ordem = typeof data.ordem === 'number' ? data.ordem : 0;
        const cursoId = data.cursoId;

        if (!cursoId) {
            return NextResponse.json({ error: 'cursoId é obrigatório' }, { status: 400 });
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
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 });
        }

        await sql`
            DELETE FROM "Modulo" WHERE id = ${id}
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
