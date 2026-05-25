import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const { id } = await params;
    const userId = session.user.id;
    try {
        const d = await req.json();
        const valor = parseFloat(d.valor);
        if (!valor || valor <= 0) return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });

        const obj = await sql`SELECT * FROM "ObjetivoFinanceiro" WHERE "id"=${id} AND "userId"=${userId}`;
        if (!obj.length) return NextResponse.json({ error: 'Objetivo não encontrado' }, { status: 404 });
        const o = obj[0] as Record<string, unknown>;
        const novoValor = Number(o.valorAtual) + valor;
        const concluido = novoValor >= Number(o.valorMeta);

        await sql`
            UPDATE "ObjetivoFinanceiro" SET
                "valorAtual"=${novoValor},
                "status"=${concluido ? 'CONCLUIDO' : 'EM_ANDAMENTO'},
                "updatedAt"=NOW()
            WHERE "id"=${id} AND "userId"=${userId}`;

        // Create transaction
        const contaId = d.contaBancariaId && d.contaBancariaId !== 'caixa-geral' ? d.contaBancariaId : null;
        await sql`
            INSERT INTO "Transacao" ("id","descricao","valor","data","tipo","isFixa","isParcela","paga","contaBancariaId","objetivoId","userId","createdAt","updatedAt")
            VALUES (${crypto.randomUUID()},${d.descricao || o.nome as string},${valor},NOW(),'DESPESA',false,false,true,${contaId},${id},${userId},NOW(),NOW())`;

        if (contaId) {
            await sql`UPDATE "ContaBancaria" SET "saldoAtual"="saldoAtual"-${valor},"updatedAt"=NOW() WHERE "id"=${contaId} AND "userId"=${userId}`;
        }

        return NextResponse.json({ success: true, concluido, novoValor });
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
