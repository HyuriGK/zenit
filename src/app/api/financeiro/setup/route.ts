import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    try {
        await sql`
            CREATE TABLE IF NOT EXISTS "ContaBancaria" (
                "id"           TEXT PRIMARY KEY,
                "nome"         TEXT NOT NULL,
                "tipo"         TEXT NOT NULL,
                "banco"        TEXT,
                "saldoInicial" FLOAT NOT NULL DEFAULT 0,
                "saldoAtual"   FLOAT NOT NULL DEFAULT 0,
                "cor"          TEXT NOT NULL DEFAULT '#10B981',
                "icone"        TEXT NOT NULL DEFAULT 'wallet',
                "ativa"        BOOLEAN NOT NULL DEFAULT true,
                "userId"       TEXT NOT NULL,
                "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`;

        await sql`
            CREATE TABLE IF NOT EXISTS "Cartao" (
                "id"             TEXT PRIMARY KEY,
                "nome"           TEXT NOT NULL,
                "bandeira"       TEXT,
                "ultimosDigitos" TEXT,
                "limite"         FLOAT,
                "diaVencimento"  INT,
                "diaFechamento"  INT,
                "cor"            TEXT NOT NULL DEFAULT '#3B82F6',
                "icone"          TEXT NOT NULL DEFAULT 'credit-card',
                "ativo"          BOOLEAN NOT NULL DEFAULT true,
                "userId"         TEXT NOT NULL,
                "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`;

        await sql`
            CREATE TABLE IF NOT EXISTS "Categoria" (
                "id"             TEXT PRIMARY KEY,
                "nome"           TEXT NOT NULL,
                "tipo"           TEXT NOT NULL,
                "cor"            TEXT NOT NULL DEFAULT '#10B981',
                "icone"          TEXT NOT NULL DEFAULT 'tag',
                "categoriaPaiId" TEXT,
                "userId"         TEXT NOT NULL,
                "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`;

        await sql`
            CREATE TABLE IF NOT EXISTS "ObjetivoFinanceiro" (
                "id"                  TEXT PRIMARY KEY,
                "nome"                TEXT NOT NULL,
                "descricao"           TEXT,
                "valorMeta"           FLOAT NOT NULL,
                "valorAtual"          FLOAT NOT NULL DEFAULT 0,
                "dataInicio"          DATE NOT NULL DEFAULT NOW(),
                "dataMeta"            DATE,
                "isReservaEmergencia" BOOLEAN NOT NULL DEFAULT false,
                "cor"                 TEXT NOT NULL DEFAULT '#F59E0B',
                "icone"               TEXT NOT NULL DEFAULT 'target',
                "status"              TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',
                "userId"              TEXT NOT NULL,
                "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`;

        await sql`
            CREATE TABLE IF NOT EXISTS "Transacao" (
                "id"              TEXT PRIMARY KEY,
                "descricao"       TEXT NOT NULL,
                "valor"           FLOAT NOT NULL,
                "data"            DATE NOT NULL,
                "tipo"            TEXT NOT NULL,
                "observacoes"     TEXT,
                "isFixa"          BOOLEAN NOT NULL DEFAULT false,
                "isParcela"       BOOLEAN NOT NULL DEFAULT false,
                "parcelaNumero"   INT,
                "parcelaTotais"   INT,
                "grupoParcelaId"  TEXT,
                "paga"            BOOLEAN NOT NULL DEFAULT false,
                "categoriaId"     TEXT,
                "contaBancariaId" TEXT,
                "cartaoId"        TEXT,
                "objetivoId"      TEXT,
                "userId"          TEXT NOT NULL,
                "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`;

        await sql`
            ALTER TABLE "Transacao" ADD COLUMN IF NOT EXISTS "paga" BOOLEAN NOT NULL DEFAULT false`;

        return NextResponse.json({ success: true, message: 'Tabelas financeiras criadas/verificadas com sucesso.' });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
