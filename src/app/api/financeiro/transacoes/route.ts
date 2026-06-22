import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { auth } from '@/auth';
import { extrairDataString } from '@/lib/timezone';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const userId = session.user.id;
    try {
        const rows = await sql`SELECT * FROM "Transacao" WHERE "userId" = ${userId} ORDER BY "data" DESC`;
        const data = rows.map(row => ({
            ...row,
            data: extrairDataString(row.data as string | Date),
        }));
        return NextResponse.json({ data });
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const userId = session.user.id;
    try {
        const body = await request.json();
        // Accepts single transaction or array
        const items: any[] = Array.isArray(body) ? body : [body];
        const results: any[] = [];

        for (const d of items) {
            const id = d.id || crypto.randomUUID();
            const dataVal = extrairDataString(d.data);
            const valor = parseFloat(d.valor);
            const contaId = d.contaBancariaId && d.contaBancariaId !== 'caixa-geral' ? d.contaBancariaId : null;
            const paga = d.paga === true;

            const row = await sql`
                INSERT INTO "Transacao" (
                    "id","descricao","valor","data","tipo","observacoes",
                    "isFixa","isParcela","parcelaNumero","parcelaTotais","grupoParcelaId",
                    "paga","categoriaId","contaBancariaId","cartaoId","objetivoId","userId","createdAt","updatedAt"
                ) VALUES (
                    ${id},${d.descricao},${valor},${dataVal}::date,${d.tipo},${d.observacoes || null},
                    ${d.isFixa || false},${d.isParcela || false},${d.parcelaNumero || null},${d.parcelaTotais || null},${d.grupoParcelaId || null},
                    ${paga},${d.categoriaId || null},${contaId},${d.cartaoId || null},${d.objetivoId || null},${userId},NOW(),NOW()
                )
                RETURNING *`;

            results.push({
                ...row[0],
                data: extrairDataString((row[0] as Record<string, unknown>).data as string | Date),
            });

            // Update account balance for the first item in a series (or single)
            if (paga && contaId && d._updateBalance !== false) {
                const diff = d.tipo === 'RECEITA' ? valor : -valor;
                await sql`
                    UPDATE "ContaBancaria"
                    SET "saldoAtual" = "saldoAtual" + ${diff}, "updatedAt" = NOW()
                    WHERE "id" = ${contaId} AND "userId" = ${userId}`;
            }
        }

        return NextResponse.json({ data: Array.isArray(body) ? results : results[0] }, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
