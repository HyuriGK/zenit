import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }
        const { id: veiculoId } = params;

        const transacoes = await sql`
            SELECT * FROM "TransacaoVeiculo"
            WHERE "veiculoId" = ${veiculoId}
            ORDER BY "data" DESC, "createdAt" DESC
        `;
        return NextResponse.json({ data: transacoes });
    } catch (error) {
        console.error('Erro ao buscar transações do veículo:', error);
        return NextResponse.json(
            { error: 'Falha ao buscar transações.' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }
        const { id: veiculoId } = params;
        const data = await request.json();

        const id = crypto.randomUUID();
        const tipo = data.tipo; // MANUTENCAO, ABASTECIMENTO, INVESTIMENTO
        const valor = parseFloat(data.valor || 0);
        const dataTransacao = data.data || new Date().toISOString().split('T')[0];
        const quilometragem = data.quilometragem ? parseFloat(data.quilometragem) : null;
        const descricao = data.descricao || null;
        
        // Refuel specifics
        const litros = data.litros ? parseFloat(data.litros) : null;
        const posto = data.posto || null;
        const precoPorLitro = data.precoPorLitro ? parseFloat(data.precoPorLitro) : null;

        const result = await sql`
            INSERT INTO "TransacaoVeiculo" (
                id, "tipo", "valor", "data", "quilometragem", "descricao",
                "litros", "posto", "precoPorLitro", "veiculoId",
                "createdAt", "updatedAt"
            ) VALUES (
                ${id}, ${tipo}, ${valor}, ${dataTransacao}, ${quilometragem}, ${descricao},
                ${litros}, ${posto}, ${precoPorLitro}, ${veiculoId},
                NOW(), NOW()
            )
            RETURNING *;
        `;

        // Se houver quilometragem, atualizar a quilometragem atual do veículo se for maior
        if (quilometragem) {
            await sql`
                UPDATE "Veiculo"
                SET "quilometragemAtual" = GREATEST("quilometragemAtual", ${quilometragem}),
                    "updatedAt" = NOW()
                WHERE id = ${veiculoId}
            `;
        }

        return NextResponse.json({ data: result[0] }, { status: 201 });
    } catch (error) {
        console.error('Erro ao criar transação do veículo:', error);
        return NextResponse.json(
            { error: 'Erro ao criar registro', details: (error as Error).message },
            { status: 500 }
        );
    }
}
