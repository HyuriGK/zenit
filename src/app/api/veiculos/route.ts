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

        const veiculos = await sql`
            SELECT * FROM "Veiculo"
            WHERE "userId" = ${userId}
            ORDER BY "createdAt" DESC
        `;
        return NextResponse.json({ data: veiculos });
    } catch (error) {
        console.error('Erro ao buscar veículos:', error);
        return NextResponse.json(
            { error: 'Falha ao buscar veículos.' },
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
        const id = crypto.randomUUID();
        const nome = data.nome;
        const modelo = data.modelo || null;
        const marca = data.marca || null;
        const placa = data.placa || null;
        const ano = data.ano ? parseInt(data.ano) : null;
        const cor = data.cor || null;
        const quilometragemInicial = parseFloat(data.quilometragemInicial || 0);
        const quilometragemAtual = parseFloat(data.quilometragemAtual || quilometragemInicial);
        const tipoCombustivel = data.tipoCombustivel || 'FLEX';

        const result = await sql`
            INSERT INTO "Veiculo" (
                id, "nome", "modelo", "marca", "placa", "ano", "cor",
                "quilometragemInicial", "quilometragemAtual", "tipoCombustivel",
                "userId", "createdAt", "updatedAt"
            ) VALUES (
                ${id}, ${nome}, ${modelo}, ${marca}, ${placa}, ${ano}, ${cor},
                ${quilometragemInicial}, ${quilometragemAtual}, ${tipoCombustivel},
                ${userId}, NOW(), NOW()
            )
            RETURNING *;
        `;

        return NextResponse.json({ data: result[0] }, { status: 201 });
    } catch (error) {
        console.error('Erro ao criar veículo:', error);
        return NextResponse.json(
            { error: 'Erro ao criar veículo', details: (error as Error).message },
            { status: 500 }
        );
    }
}
