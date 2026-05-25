import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon';
import { auth } from '@/auth';
import { encrypt, decrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }
        const userId = session.user.id;

        const rows = await sql`
            SELECT * FROM "SenhaArmazenada"
            WHERE "userId" = ${userId}
            ORDER BY "nome" ASC
        `;

        const data = rows.map((r: Record<string, unknown>) => ({
            ...r,
            senha: decrypt(r.senha as string),
        }));

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Erro ao buscar senhas:', error);
        return NextResponse.json({ error: 'Falha ao buscar senhas.' }, { status: 500 });
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

        if (!data.nome || !data.usuario || !data.senha) {
            return NextResponse.json({ error: 'Nome, usuário e senha são obrigatórios.' }, { status: 400 });
        }

        const id = crypto.randomUUID();
        const senhaEncriptada = encrypt(data.senha);

        const result = await sql`
            INSERT INTO "SenhaArmazenada" (
                "id", "nome", "url", "usuario", "senha", "categoria", "notas", "cor", "userId", "createdAt", "updatedAt"
            ) VALUES (
                ${id}, ${data.nome}, ${data.url || null}, ${data.usuario},
                ${senhaEncriptada}, ${data.categoria || null}, ${data.notas || null},
                ${data.cor || '#059669'}, ${userId}, NOW(), NOW()
            )
            RETURNING *;
        `;

        const row = result[0] as Record<string, unknown>;
        return NextResponse.json({ data: { ...row, senha: data.senha } }, { status: 201 });
    } catch (error) {
        console.error('Erro ao criar senha:', error);
        return NextResponse.json({ error: 'Erro ao criar senha.' }, { status: 500 });
    }
}
