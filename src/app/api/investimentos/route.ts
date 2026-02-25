import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';

export async function GET() {
    try {
        const ativos = await sql`
            SELECT * FROM "AtivoInvestimento"
            ORDER BY "createdAt" DESC, "nome" ASC
        `;
        return NextResponse.json({ data: ativos });
    } catch (error) {
        console.error('Erro ao buscar ativos:', error);
        return NextResponse.json(
            { error: 'Falha ao buscar ativos.' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const id = data.id || crypto.randomUUID();
        const nome = data.nome || 'ATIVO';
        const tipo = data.tipo || 'ACAO';
        const quantidade = Number(data.quantidade || 0);
        const precoCota = Number(data.precoCota || 0);
        const taxas = Number(data.taxas || 0);
        const precoMedio = Number(data.precoMedio || 0);
        const valorAtual = Number(data.valorAtual || precoCota);
        const setor = data.setor || null;
        const dataCompra = data.dataCompra || new Date().toISOString().split('T')[0];

        // Mock User
        const userId = '12345678-user-mock-abcd';

        const result = await sql`
            INSERT INTO "AtivoInvestimento" (
                id, "nome", "tipo", "quantidade", "precoCota", "taxas",
                "precoMedio", "valorAtual", "setor", "dataCompra",
                "userId", "updatedAt"
            ) VALUES (
                ${id}, ${nome}, ${tipo}, ${quantidade}, ${precoCota}, ${taxas},
                ${precoMedio}, ${valorAtual}, ${setor}, ${dataCompra},
                ${userId}, NOW()
            )
            RETURNING *;
        `;

        return NextResponse.json({ data: result[0] }, { status: 201 });
    } catch (error) {
        console.error('Erro ao criar ativo:', error);
        return NextResponse.json(
            { error: 'Erro ao criar ativo', details: (error as Error).message },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const data = await request.json();
        const id = data.id;

        if (!id) return NextResponse.json({ error: 'ID faltante' }, { status: 400 });

        // Build dynamic SET string or update everything we expect.
        // For simplicity, updating all core fields if present, else keep them.
        const nome = data.nome;
        const tipo = data.tipo;
        const quantidade = Number(data.quantidade);
        const precoCota = Number(data.precoCota);
        const taxas = Number(data.taxas);
        const precoMedio = Number(data.precoMedio);
        const valorAtual = Number(data.valorAtual);
        const setor = data.setor || null;
        const dataCompra = data.dataCompra;

        const result = await sql`
            UPDATE "AtivoInvestimento" SET
                "nome" = COALESCE(${nome}, "nome"),
                "tipo" = COALESCE(${tipo}, "tipo"),
                "quantidade" = COALESCE(${quantidade}, "quantidade"),
                "precoCota" = COALESCE(${precoCota}, "precoCota"),
                "taxas" = COALESCE(${taxas}, "taxas"),
                "precoMedio" = COALESCE(${precoMedio}, "precoMedio"),
                "valorAtual" = COALESCE(${valorAtual}, "valorAtual"),
                "setor" = COALESCE(${setor}, "setor"),
                "dataCompra" = COALESCE(${dataCompra}, "dataCompra"),
                "updatedAt" = NOW()
            WHERE id = ${id}
            RETURNING *;
        `;

        return NextResponse.json({ data: result[0] }, { status: 200 });
    } catch (error) {
        console.error('Erro ao atualizar ativo:', error);
        return NextResponse.json({ error: 'Erro ao atualizar ativo' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID faltante' }, { status: 400 });

        await sql`DELETE FROM "AtivoInvestimento" WHERE id = ${id}`;

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Erro ao deletar ativo:', error);
        return NextResponse.json({ error: 'Erro ao deletar ativo' }, { status: 500 });
    }
}
