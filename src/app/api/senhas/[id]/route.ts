import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { auth } from '@/auth';
import { encrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

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

        const senhaEncriptada = data.senha ? encrypt(data.senha) : null;

        const result = await sql`
            UPDATE "SenhaArmazenada" SET
                "nome"      = COALESCE(${data.nome}, "nome"),
                "url"       = COALESCE(${data.url ?? null}, "url"),
                "usuario"   = COALESCE(${data.usuario}, "usuario"),
                "senha"     = COALESCE(${senhaEncriptada}, "senha"),
                "categoria" = COALESCE(${data.categoria ?? null}, "categoria"),
                "notas"     = COALESCE(${data.notas ?? null}, "notas"),
                "cor"       = COALESCE(${data.cor}, "cor"),
                "updatedAt" = NOW()
            WHERE "id" = ${id} AND "userId" = ${userId}
            RETURNING *;
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Registro não encontrado.' }, { status: 404 });
        }

        const row = result[0] as Record<string, unknown>;
        return NextResponse.json({ data: { ...row, senha: data.senha } });
    } catch (error) {
        console.error('Erro ao atualizar senha:', error);
        return NextResponse.json({ error: 'Erro ao atualizar senha.' }, { status: 500 });
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
            DELETE FROM "SenhaArmazenada"
            WHERE "id" = ${id} AND "userId" = ${userId}
            RETURNING id;
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Registro não encontrado.' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao deletar senha:', error);
        return NextResponse.json({ error: 'Erro ao deletar senha.' }, { status: 500 });
    }
}
