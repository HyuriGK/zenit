import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const userId = session.user.id;

    try {
        const { contas, cartoes, categorias, transacoes, objetivos } = await request.json();
        const stats = { contas: 0, cartoes: 0, categorias: 0, transacoes: 0, objetivos: 0, erros: 0 };

        // Contas bancárias
        for (const d of contas || []) {
            try {
                await sql`
                    INSERT INTO "ContaBancaria" ("id","nome","tipo","banco","saldoInicial","saldoAtual","cor","icone","ativa","userId","createdAt","updatedAt")
                    VALUES (${d.id},${d.nome},${d.tipo || 'CORRENTE'},${d.banco || null},${Number(d.saldoInicial || 0)},${Number(d.saldoAtual || 0)},${d.cor || '#059669'},${d.icone || 'wallet'},${d.ativa !== false},${userId},${new Date(d.createdAt || Date.now())},${new Date(d.updatedAt || Date.now())})
                    ON CONFLICT ("id") DO NOTHING`;
                stats.contas++;
            } catch { stats.erros++; }
        }

        // Cartões
        for (const d of cartoes || []) {
            try {
                await sql`
                    INSERT INTO "Cartao" ("id","nome","bandeira","ultimosDigitos","limite","diaVencimento","diaFechamento","cor","icone","ativo","userId","createdAt","updatedAt")
                    VALUES (${d.id},${d.nome},${d.bandeira || null},${d.ultimosDigitos || null},${d.limite ? Number(d.limite) : null},${d.diaVencimento ? Number(d.diaVencimento) : null},${d.diaFechamento ? Number(d.diaFechamento) : null},${d.cor || '#3b82f6'},${d.icone || 'credit-card'},${d.ativo !== false},${userId},${new Date(d.createdAt || Date.now())},${new Date(d.updatedAt || Date.now())})
                    ON CONFLICT ("id") DO NOTHING`;
                stats.cartoes++;
            } catch { stats.erros++; }
        }

        // Categorias
        for (const d of categorias || []) {
            try {
                await sql`
                    INSERT INTO "Categoria" ("id","nome","tipo","cor","icone","userId","createdAt","updatedAt")
                    VALUES (${d.id},${d.nome},${d.tipo},${d.cor || '#059669'},${d.icone || 'tag'},${userId},${new Date(d.createdAt || Date.now())},${new Date(d.updatedAt || Date.now())})
                    ON CONFLICT ("id") DO NOTHING`;
                stats.categorias++;
            } catch { stats.erros++; }
        }

        // Objetivos financeiros
        for (const d of objetivos || []) {
            try {
                await sql`
                    INSERT INTO "ObjetivoFinanceiro" ("id","nome","descricao","valorMeta","valorAtual","dataInicio","dataMeta","isReservaEmergencia","cor","icone","status","userId","createdAt","updatedAt")
                    VALUES (${d.id},${d.nome},${d.descricao || null},${Number(d.valorMeta)},${Number(d.valorAtual || 0)},${new Date(d.dataInicio || Date.now())},${d.dataMeta ? new Date(d.dataMeta) : null},${d.isReservaEmergencia || false},${d.cor || '#059669'},${d.icone || 'target'},${d.status || 'EM_ANDAMENTO'},${userId},${new Date(d.createdAt || Date.now())},${new Date(d.updatedAt || Date.now())})
                    ON CONFLICT ("id") DO NOTHING`;
                stats.objetivos++;
            } catch { stats.erros++; }
        }

        // Transações (sem atualizar saldo — saldo já vem da conta migrada)
        for (const d of transacoes || []) {
            try {
                const contaId = d.contaBancariaId && d.contaBancariaId !== 'caixa-geral' ? d.contaBancariaId : null;
                await sql`
                    INSERT INTO "Transacao" ("id","descricao","valor","data","tipo","observacoes","isFixa","isParcela","parcelaNumero","parcelaTotais","grupoParcelaId","paga","categoriaId","contaBancariaId","cartaoId","objetivoId","userId","createdAt","updatedAt")
                    VALUES (${d.id},${d.descricao},${Number(d.valor)},${new Date(d.data)},${d.tipo},${d.observacoes || null},${d.isFixa || false},${d.isParcela || false},${d.parcelaNumero || null},${d.parcelaTotais || null},${d.grupoParcelaId || null},${d.paga || false},${d.categoriaId || null},${contaId},${d.cartaoId || null},${d.objetivoId || null},${userId},${new Date(d.createdAt || Date.now())},${new Date(d.updatedAt || Date.now())})
                    ON CONFLICT ("id") DO NOTHING`;
                stats.transacoes++;
            } catch { stats.erros++; }
        }

        return NextResponse.json({ success: true, stats });
    } catch (e) {
        console.error('Erro na migração:', e);
        return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
    }
}
