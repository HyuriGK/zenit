import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }
        const userId = session.user.id;

        const result = await sql`
            SELECT * FROM "Veiculo"
            WHERE id = ${id} AND "userId" = ${userId}
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Veículo não encontrado' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Erro ao buscar veículo:', error);
        return NextResponse.json({ error: 'Erro ao buscar veículo' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }
        const userId = session.user.id;
        const data = await request.json();

        // Update fields if provided
        const result = await sql`
            UPDATE "Veiculo" SET
                "nome" = COALESCE(${data.nome}, "nome"),
                "modelo" = COALESCE(${data.modelo}, "modelo"),
                "marca" = COALESCE(${data.marca}, "marca"),
                "placa" = COALESCE(${data.placa}, "placa"),
                "ano" = COALESCE(${data.ano ? parseInt(data.ano) : null}, "ano"),
                "cor" = COALESCE(${data.cor}, "cor"),
                "quilometragemInicial" = COALESCE(${data.quilometragemInicial ? parseFloat(data.quilometragemInicial) : null}, "quilometragemInicial"),
                "quilometragemAtual" = COALESCE(${data.quilometragemAtual ? parseFloat(data.quilometragemAtual) : null}, "quilometragemAtual"),
                "tipoCombustivel" = COALESCE(${data.tipoCombustivel}, "tipoCombustivel"),
                "updatedAt" = NOW()
            WHERE id = ${id} AND "userId" = ${userId}
            RETURNING *;
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Veículo não encontrado ou acesso negado' }, { status: 404 });
        }

        return NextResponse.json({ data: result[0] });
    } catch (error) {
        console.error('Erro ao atualizar veículo:', error);
        return NextResponse.json({ error: 'Erro ao atualizar veículo' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }
        const userId = session.user.id;

        const result = await sql`
            DELETE FROM "Veiculo"
            WHERE id = ${id} AND "userId" = ${userId}
            RETURNING id;
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Veículo não encontrado ou acesso negado' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao deletar veículo:', error);
        return NextResponse.json({ error: 'Erro ao deletar veículo' }, { status: 500 });
    }
}
