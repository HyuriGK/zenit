import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';

// GET: Retornar todos os compromissos do usuário
export async function GET() {
    try {
        const compromissos = await sql`
      SELECT * FROM "Compromisso"
      ORDER BY "data" ASC, "horaInicio" ASC
    `;

        return NextResponse.json({ data: compromissos });
    } catch (error) {
        console.error('Erro ao buscar compromissos no Neon:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar compromissos.' },
            { status: 500 }
        );
    }
}

// POST: Criar um novo compromisso
export async function POST(request: Request) {
    try {
        const data = await request.json();

        const id = data.id || crypto.randomUUID();
        const titulo = data.titulo || 'Novo Compromisso';
        const descricao = data.descricao || null;
        const dataCompromisso = data.data; // Passado como YYYY-MM-DD
        const horaInicio = data.horaInicio || '00:00';
        const horaFim = data.horaFim || null;
        const categoria = data.categoria || null;
        const cor = data.cor || '#3b82f6';

        // Recorrência
        const isRecorrente = Boolean(data.isRecorrente);
        const tipoRecorrencia = data.tipoRecorrencia || null;
        const intervaloRecorrencia = data.intervaloRecorrencia ? Number(data.intervaloRecorrencia) : null;
        const dataFimRecorrencia = data.dataFimRecorrencia || null;
        const syncWithGoogle = Boolean(data.syncWithGoogle);

        // User Mock até a fase de auth real estar conectada
        const userId = '12345678-user-mock-abcd';

        const resultado = await sql`
      INSERT INTO "Compromisso" (
        id, "titulo", "descricao", "data", "horaInicio", "horaFim", 
        "categoria", "cor", "concluido", "isRecorrente", "tipoRecorrencia", 
        "intervaloRecorrencia", "dataFimRecorrencia", "syncWithGoogle", 
        "userId", "updatedAt"
      ) VALUES (
        ${id}, ${titulo}, ${descricao}, ${dataCompromisso}, ${horaInicio}, ${horaFim}, 
        ${categoria}, ${cor}, false, ${isRecorrente}, ${tipoRecorrencia}, 
        ${intervaloRecorrencia}, ${dataFimRecorrencia}, ${syncWithGoogle}, 
        ${userId}, NOW()
      )
      RETURNING *;
    `;

        return NextResponse.json({ data: resultado[0] }, { status: 201 });
    } catch (error) {
        console.error('Erro ao inserir Compromisso no Neon:', error);
        return NextResponse.json(
            { error: 'Erro ao criar compromisso', details: (error as Error).message },
            { status: 500 }
        );
    }
}

// PUT: Atualizar um compromisso
export async function PUT(request: Request) {
    try {
        const data = await request.json();
        const id = data.id;
        if (!id) return NextResponse.json({ error: 'ID faltante' }, { status: 400 });

        const titulo = data.titulo;
        const descricao = data.descricao || null;
        const dataCompromisso = data.data; // Passado como YYYY-MM-DD
        const horaInicio = data.horaInicio;
        const horaFim = data.horaFim || null;
        const categoria = data.categoria || null;
        const cor = data.cor || '#3b82f6';

        // Recorrência
        const isRecorrente = Boolean(data.isRecorrente);
        const tipoRecorrencia = data.tipoRecorrencia || null;
        const intervaloRecorrencia = data.intervaloRecorrencia ? Number(data.intervaloRecorrencia) : null;
        const dataFimRecorrencia = data.dataFimRecorrencia || null;
        const syncWithGoogle = Boolean(data.syncWithGoogle);

        const resultado = await sql`
      UPDATE "Compromisso" SET
        "titulo" = ${titulo}, "descricao" = ${descricao}, "data" = ${dataCompromisso}, 
        "horaInicio" = ${horaInicio}, "horaFim" = ${horaFim}, "categoria" = ${categoria},
        "cor" = ${cor}, "isRecorrente" = ${isRecorrente}, "tipoRecorrencia" = ${tipoRecorrencia},
        "intervaloRecorrencia" = ${intervaloRecorrencia}, "dataFimRecorrencia" = ${dataFimRecorrencia},
        "syncWithGoogle" = ${syncWithGoogle}, "updatedAt" = NOW()
      WHERE id = ${id}
      RETURNING *;
    `;

        return NextResponse.json({ data: resultado[0] }, { status: 200 });
    } catch (error) {
        console.error('Erro ao editar Compromisso no Neon:', error);
        return NextResponse.json({ error: 'Erro ao editar compromisso' }, { status: 500 });
    }
}

// DELETE: Deletar um compromisso
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID faltante' }, { status: 400 });

        await sql`DELETE FROM "Compromisso" WHERE id = ${id}`;

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Erro ao deletar Compromisso no Neon:', error);
        return NextResponse.json({ error: 'Erro ao deletar compromisso' }, { status: 500 });
    }
}
