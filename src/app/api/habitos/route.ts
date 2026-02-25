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

        const habitos = await sql`
            SELECT * FROM "Habito" 
            WHERE "userId" = ${userId}
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
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }
        const userId = session.user.id;

        const data = await request.json();
        const id = data.id || crypto.randomUUID();
        const nome = data.nome || 'Novo Hábito';
        const descricao = data.descricao || null;
        const icone = data.icone || 'target';
        const cor = data.cor || '#ef4444';
        const frequencia = data.frequencia || 'DIARIA';

        let diasSemanaFormatados = '{}';
        if (data.diasSemana && Array.isArray(data.diasSemana)) {
            diasSemanaFormatados = `{${data.diasSemana.join(',')}}`;
        }

        const metaVezes = data.metaVezes || null;
        const periodoDia = data.periodoDia || null;
        const status = data.status || 'ATIVO';

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

export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }
        const userId = session.user.id;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID faltante' }, { status: 400 });

        await sql`DELETE FROM "Habito" WHERE id = ${id} AND "userId" = ${userId}`;

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Erro ao deletar Hábito no Neon:', error);
        return NextResponse.json({ error: 'Erro ao deletar Hábito' }, { status: 500 });
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
        const id = data.id;

        if (!id) return NextResponse.json({ error: 'ID faltante' }, { status: 400 });

        if (data.sequenciaAtual !== undefined) {
            const seq = Number(data.sequenciaAtual);
            const result = await sql`
                UPDATE "Habito" 
                SET "sequenciaAtual" = ${seq}, "updatedAt" = NOW() 
                WHERE id = ${id} AND "userId" = ${userId}
                RETURNING id;
            `;
            if (result.length === 0) {
                return NextResponse.json({ error: 'Hábito não encontrado ou acesso negado' }, { status: 404 });
            }
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Erro ao atualizar Hábito no Neon:', error);
        return NextResponse.json({ error: 'Erro ao atualizar Hábito' }, { status: 500 });
    }
}
