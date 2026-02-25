import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// GET para retornar anotações livres do Planner base/dashboard
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }
        const userId = session.user.id;

        const { searchParams } = new URL(request.url);
        const cursoId = searchParams.get('cursoId');

        let anotacoes;

        if (cursoId) {
            anotacoes = await sql`
                SELECT a.* FROM "Anotacao" a
                JOIN "Curso" c ON a."cursoId" = c.id
                WHERE a."cursoId" = ${cursoId} AND c."userId" = ${userId}
                ORDER BY a."dataCriacao" DESC
            `;
        } else {
            // Se não passar cursoId, retorna todas as que o usuário tem acesso (anotações livres ou de qualquer curso dele)
            anotacoes = await sql`
                SELECT a.* FROM "Anotacao" a
                LEFT JOIN "Curso" c ON a."cursoId" = c.id
                LEFT JOIN "Modulo" m ON a."moduloId" = m.id
                LEFT JOIN "Curso" mc ON m."cursoId" = mc.id
                WHERE c."userId" = ${userId} OR mc."userId" = ${userId}
                ORDER BY a."dataCriacao" DESC
            `;
        }

        return NextResponse.json({ data: anotacoes });
    } catch (error) {
        console.error('Erro ao buscar anotações:', error);
        return NextResponse.json(
            { error: 'Falha ao buscar anotações.' },
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
        const titulo = data.titulo || 'Nova Página';
        const conteudo = data.conteudo || '';
        const cor = data.cor || '#FBBF24';
        const tipoOrigem = data.tipoOrigem || null;
        const audioUrl = data.audioUrl || null;
        const audioDuracao = data.audioDuracao || null;
        const transcricaoOriginal = data.transcricaoOriginal || null;
        const moduloId = data.moduloId || null;
        const cursoId = data.cursoId || null;

        // Verificar se o usuário é dono do curso ou modulo
        if (cursoId) {
            const owner = await sql`SELECT id FROM "Curso" WHERE id = ${cursoId} AND "userId" = ${userId}`;
            if (owner.length === 0) return NextResponse.json({ error: 'Acesso negado ao curso' }, { status: 403 });
        } else if (moduloId) {
            const owner = await sql`
                SELECT m.id FROM "Modulo" m 
                JOIN "Curso" c ON m."cursoId" = c.id 
                WHERE m.id = ${moduloId} AND c."userId" = ${userId}
            `;
            if (owner.length === 0) return NextResponse.json({ error: 'Acesso negado ao módulo' }, { status: 403 });
        } else {
            return NextResponse.json({ error: 'cursoId ou moduloId é obrigatório' }, { status: 400 });
        }

        const result = await sql`
            INSERT INTO "Anotacao" (
                id, "titulo", "conteudo", "cor", "tipoOrigem", "audioUrl", "audioDuracao", "transcricaoOriginal",
                "moduloId", "cursoId", "dataCriacao", "dataAtualizacao"
            ) VALUES (
                ${id}, ${titulo}, ${conteudo}, ${cor}, ${tipoOrigem}, ${audioUrl}, ${audioDuracao}, ${transcricaoOriginal},
                ${moduloId}, ${cursoId}, NOW(), NOW()
            )
            RETURNING *;
        `;

        return NextResponse.json({ data: result[0] }, { status: 201 });
    } catch (error) {
        console.error('Erro ao criar anotação:', error);
        return NextResponse.json(
            { error: 'Erro ao criar anotação', details: (error as Error).message },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }
        const userId = session.user.id;

        const data = await request.json();
        const { id, titulo, conteudo } = data;

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
        }

        const result = await sql`
            UPDATE "Anotacao"
            SET 
                "titulo" = COALESCE(${titulo}, "titulo"),
                "conteudo" = COALESCE(${conteudo}, "conteudo"),
                "dataAtualizacao" = NOW()
            WHERE id = ${id} AND (
                "cursoId" IN (SELECT id FROM "Curso" WHERE "userId" = ${userId})
                OR 
                "moduloId" IN (SELECT m.id FROM "Modulo" m JOIN "Curso" c ON m."cursoId" = c.id WHERE c."userId" = ${userId})
            )
            RETURNING *;
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Anotação não encontrada ou acesso negado' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] }, { status: 200 });
    } catch (error) {
        console.error('Erro ao atualizar anotação:', error);
        return NextResponse.json({ error: 'Falha ao atualizar anotação.' }, { status: 500 });
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

        await sql`
            DELETE FROM "Anotacao" 
            WHERE id = ${id} AND (
                "cursoId" IN (SELECT id FROM "Curso" WHERE "userId" = ${userId})
                OR 
                "moduloId" IN (SELECT m.id FROM "Modulo" m JOIN "Curso" c ON m."cursoId" = c.id WHERE c."userId" = ${userId})
            )
        `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao excluir anotação:', error);
        return NextResponse.json(
            { error: 'Falha ao excluir anotação.' },
            { status: 500 }
        );
    }
}
