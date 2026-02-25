import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Busca todos os hábitos, trazendo os mais recentes primeiro
        const habitos = await sql`
      SELECT * FROM "Habito" 
      ORDER BY "createdAt" DESC
    `;

        return NextResponse.json({ data: habitos });
    } catch (error) {
        console.error('Erro ao buscar hábitos no Neon:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar hábitos.' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Como a tabela foi criada pelo Prisma, os Arrays de Int se chamam Int[] e IDs são String UUIDs genéricos
        const id = data.id || crypto.randomUUID();
        const nome = data.nome || 'Novo Hábito';
        const descricao = data.descricao || null;
        const icone = data.icone || 'target';
        const cor = data.cor || '#ef4444';
        const frequencia = data.frequencia || 'DIARIA';

        // Precisamos formatar o array do JS para a formatação do PostgreSQL {1,2,3}
        let diasSemanaFormatados = '{}';
        if (data.diasSemana && Array.isArray(data.diasSemana)) {
            diasSemanaFormatados = `{${data.diasSemana.join(',')}}`;
        }

        const metaVezes = data.metaVezes || null;
        const periodoDia = data.periodoDia || null;
        const status = data.status || 'ATIVO';
        // Necessitamos de um userId fictício para testes enquanto a auth principal não funciona
        const userId = '12345678-user-mock-abcd';

        // Inserção usando param tags seguras p/ evitar SQL Injection
        const resultado = await sql`
      INSERT INTO "Habito" (
        id, "nome", "descricao", "icone", "cor", "frequencia", 
        "diasSemana", "metaVezes", "periodoDia", "status", 
        "dataInicio", "sequenciaAtual", "melhorSequencia", 
        "userId", "updatedAt"
      ) VALUES (
        ${id}, ${nome}, ${descricao}, ${icone}, ${cor}, ${frequencia}, 
        ${diasSemanaFormatados}, ${metaVezes}, ${periodoDia}, ${status}, 
        NOW(), 0, 0,
        ${userId}, NOW()
      )
      RETURNING *;
    `;

        return NextResponse.json({ data: resultado[0] }, { status: 201 });
    } catch (error) {
        console.error('Erro ao inserir Hábito no Neon:', error);
        return NextResponse.json(
            { error: 'Erro ao criar hábito', details: (error as Error).message },
            { status: 500 }
        );
    }
}

// DELETE: Excluir um hábito 
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID faltante' }, { status: 400 });

        await sql`DELETE FROM "Habito" WHERE id = ${id}`;

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Erro ao deletar Hábito no Neon:', error);
        return NextResponse.json({ error: 'Erro ao deletar Hábito' }, { status: 500 });
    }
}

// PUT: Atualizar os dados de um hábito (ex: sequência)
export async function PUT(request: Request) {
    try {
        const data = await request.json();
        const id = data.id;

        if (!id) return NextResponse.json({ error: 'ID faltante' }, { status: 400 });

        // Update dinâmico baseado no que foi enviado
        if (data.sequenciaAtual !== undefined) {
            const seq = Number(data.sequenciaAtual);
            await sql`UPDATE "Habito" SET "sequenciaAtual" = ${seq}, "updatedAt" = NOW() WHERE id = ${id}`;
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Erro ao atualizar Hábito no Neon:', error);
        return NextResponse.json({ error: 'Erro ao atualizar Hábito' }, { status: 500 });
    }
}
