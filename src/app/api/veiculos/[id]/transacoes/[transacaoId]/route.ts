import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string; transacaoId: string }> }
) {
    try {
        const { id: veiculoId, transacaoId } = await params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const data = await request.json();
        const { tipo, valor, data: dataTransacao, quilometragem, descricao, litros, posto, precoPorLitro } = data;

        const result = await sql`
            UPDATE "TransacaoVeiculo" SET
                "tipo" = ${tipo},
                "valor" = ${parseFloat(valor)},
                "data" = ${dataTransacao},
                "quilometragem" = ${quilometragem ? parseFloat(quilometragem) : null},
                "descricao" = ${descricao || null},
                "litros" = ${litros ? parseFloat(litros) : null},
                "posto" = ${posto || null},
                "precoPorLitro" = ${precoPorLitro ? parseFloat(precoPorLitro) : null},
                "updatedAt" = NOW()
            WHERE id = ${transacaoId} AND "veiculoId" = ${veiculoId}
            RETURNING *;
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
        }

        // Se houver quilometragem, atualizar a quilometragem atual do veículo se for maior
        if (quilometragem) {
            await sql`
                UPDATE "Veiculo"
                SET "quilometragemAtual" = GREATEST("quilometragemAtual", ${parseFloat(quilometragem)}),
                    "updatedAt" = NOW()
                WHERE id = ${veiculoId}
            `;
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Erro ao atualizar transação do veículo:', error);
        return NextResponse.json({ error: 'Erro ao atualizar registro' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; transacaoId: string }> }
) {
    try {
        const { id: veiculoId, transacaoId } = await params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const result = await sql`
            DELETE FROM "TransacaoVeiculo"
            WHERE id = ${transacaoId} AND "veiculoId" = ${veiculoId}
            RETURNING id;
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao deletar transação do veículo:', error);
        return NextResponse.json({ error: 'Erro ao deletar registro' }, { status: 500 });
    }
}
