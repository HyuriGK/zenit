import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';

export async function GET() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS "SenhaArmazenada" (
                "id"        TEXT         NOT NULL PRIMARY KEY,
                "nome"      TEXT         NOT NULL,
                "url"       TEXT,
                "usuario"   TEXT         NOT NULL,
                "senha"     TEXT         NOT NULL,
                "categoria" TEXT,
                "notas"     TEXT,
                "cor"       TEXT         NOT NULL DEFAULT '#059669',
                "userId"    TEXT         NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `;
        return NextResponse.json({ success: true, message: 'Tabela SenhaArmazenada criada com sucesso!' });
    } catch (error) {
        console.error('Erro na migração:', error);
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
