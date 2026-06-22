import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { auth } from '@/auth';
import { extrairDataString } from '@/lib/timezone';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const { id } = await params;
    const userId = session.user.id;
    try {
        const d = await req.json();
        const contaId = d.contaBancariaId && d.contaBancariaId !== 'caixa-geral' ? d.contaBancariaId : null;

        // If account or amount changed, adjust balance
        if (d._balanceAdjust) {
            const { oldContaId, oldValor, oldTipo, newContaId, newValor, newTipo } = d._balanceAdjust;
            if (oldContaId && oldContaId !== 'caixa-geral') {
                const estorno = oldTipo === 'RECEITA' ? -parseFloat(oldValor) : parseFloat(oldValor);
                await sql`UPDATE "ContaBancaria" SET "saldoAtual"="saldoAtual"+${estorno},"updatedAt"=NOW() WHERE "id"=${oldContaId} AND "userId"=${userId}`;
            }
            if (newContaId && newContaId !== 'caixa-geral') {
                const aplicacao = newTipo === 'RECEITA' ? parseFloat(newValor) : -parseFloat(newValor);
                await sql`UPDATE "ContaBancaria" SET "saldoAtual"="saldoAtual"+${aplicacao},"updatedAt"=NOW() WHERE "id"=${newContaId} AND "userId"=${userId}`;
            }
        }

        const valor = d.valor != null ? parseFloat(d.valor) : null;
        const dataVal = d.data ? extrairDataString(d.data) : null;
        const rows = await sql`
            UPDATE "Transacao" SET
                "descricao"     = COALESCE(${d.descricao}, "descricao"),
                "valor"         = COALESCE(${valor}, "valor"),
                "data"          = COALESCE(${dataVal}::date, "data"),
                "tipo"          = COALESCE(${d.tipo}, "tipo"),
                "observacoes"   = COALESCE(${d.observacoes ?? null}, "observacoes"),
                "isFixa"        = COALESCE(${d.isFixa ?? null}, "isFixa"),
                "paga"          = COALESCE(${d.paga ?? null}, "paga"),
                "categoriaId"   = COALESCE(${d.categoriaId ?? null}, "categoriaId"),
                "contaBancariaId"= COALESCE(${contaId}, "contaBancariaId"),
                "cartaoId"      = COALESCE(${d.cartaoId ?? null}, "cartaoId"),
                "grupoParcelaId"= COALESCE(${d.grupoParcelaId ?? null}, "grupoParcelaId"),
                "updatedAt"     = NOW()
            WHERE "id" = ${id} AND "userId" = ${userId}
            RETURNING *`;
        if (!rows.length) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
        return NextResponse.json({
            data: {
                ...rows[0],
                data: extrairDataString((rows[0] as Record<string, unknown>).data as string | Date),
            },
        });
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const { id } = await params;
    const userId = session.user.id;
    const url = new URL(req.url);
    const tipo = url.searchParams.get('tipo') || 'single'; // single | series
    try {
        if (tipo === 'series') {
            // Delete this and all future transactions in the series
            const atual = await sql`SELECT * FROM "Transacao" WHERE "id"=${id} AND "userId"=${userId}`;
            if (!atual.length) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
            const t = atual[0] as Record<string, unknown>;
            let serie: any[] = [];
            if (t.grupoParcelaId) {
                serie = await sql`
                    SELECT * FROM "Transacao"
                    WHERE "grupoParcelaId"=${t.grupoParcelaId as string} AND "userId"=${userId}
                    AND "data" >= ${t.data as Date}`;
            } else if (t.isFixa) {
                serie = await sql`
                    SELECT * FROM "Transacao"
                    WHERE "descricao"=${t.descricao as string} AND "isFixa"=true
                    AND "categoriaId" IS NOT DISTINCT FROM ${t.categoriaId as string | null}
                    AND "userId"=${userId} AND "data" >= ${t.data as Date}`;
            }
            for (const s of serie) {
                const contaId = (s as Record<string, unknown>).contaBancariaId;
                if (contaId && contaId !== 'caixa-geral') {
                    const estorno = (s as Record<string, unknown>).tipo === 'RECEITA' ? -(s as any).valor : (s as any).valor;
                    await sql`UPDATE "ContaBancaria" SET "saldoAtual"="saldoAtual"+${estorno},"updatedAt"=NOW() WHERE "id"=${contaId as string} AND "userId"=${userId}`;
                }
                await sql`DELETE FROM "Transacao" WHERE "id"=${(s as any).id} AND "userId"=${userId}`;
            }
            return NextResponse.json({ success: true, count: serie.length });
        }

        // Single delete
        const row = await sql`SELECT * FROM "Transacao" WHERE "id"=${id} AND "userId"=${userId}`;
        if (!row.length) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
        const t = row[0] as Record<string, unknown>;
        const contaId = t.contaBancariaId;
        if (contaId && contaId !== 'caixa-geral') {
            const estorno = t.tipo === 'RECEITA' ? -(t as any).valor : (t as any).valor;
            await sql`UPDATE "ContaBancaria" SET "saldoAtual"="saldoAtual"+${estorno},"updatedAt"=NOW() WHERE "id"=${contaId as string} AND "userId"=${userId}`;
        }
        await sql`DELETE FROM "Transacao" WHERE "id"=${id} AND "userId"=${userId}`;
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
