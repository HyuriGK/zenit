import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';

export const dynamic = 'force-dynamic';

// GET para retornar anotações livres do Planner base/dashboard
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const cursoId = searchParams.get('cursoId');

        let anotacoes;

        if (cursoId) {
            anotacoes = await sql`
                SELECT * FROM "Anotacao"
                WHERE "cursoId" = ${cursoId}
                ORDER BY "dataCriacao" DESC
            `;
        } else {
            anotacoes = await sql`
                SELECT * FROM "Anotacao"
                ORDER BY "dataCriacao" DESC
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
            WHERE id = ${id}
            RETURNING *;
        `;

        return NextResponse.json({ data: result[0] }, { status: 200 });
    } catch (error) {
        console.error('Erro ao atualizar anotação:', error);
        return NextResponse.json({ error: 'Falha ao atualizar anotação.' }, { status: 500 });
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
            DELETE FROM "Anotacao" WHERE id = ${id}
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
