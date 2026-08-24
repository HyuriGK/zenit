import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@/lib/neon';

export const dynamic = 'force-dynamic';

type MensagemRecebida = { papel?: unknown; texto?: unknown };

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: 'A integração com a Groq ainda não foi configurada.' }, { status: 503 });

  try {
    const body = await request.json();
    const mensagens = Array.isArray(body?.mensagens) ? body.mensagens : [];
    const historico = mensagens
      .filter((mensagem: MensagemRecebida) => (mensagem.papel === 'usuario' || mensagem.papel === 'assistente') && typeof mensagem.texto === 'string' && mensagem.texto.trim().length > 0)
      .slice(-16)
      .map((mensagem: MensagemRecebida) => ({ role: mensagem.papel === 'usuario' ? 'user' as const : 'assistant' as const, content: (mensagem.texto as string).trim().slice(0, 4000) }));

    if (!historico.length) return NextResponse.json({ error: 'Envie uma mensagem para iniciar a conversa.' }, { status: 400 });

    const [compromissos, resumoFinanceiro, objetivos] = await Promise.all([
      sql`SELECT "titulo", "data", "horaInicio", "categoria", "concluido" FROM "Compromisso" WHERE "userId" = ${session.user.id} AND "data" >= CURRENT_DATE AND "data" < CURRENT_DATE + INTERVAL '8 days' ORDER BY "data" ASC, "horaInicio" ASC LIMIT 12`,
      sql`SELECT "tipo", COUNT(*)::int AS "quantidade", COALESCE(SUM("valor"), 0)::float AS "total" FROM "Transacao" WHERE "userId" = ${session.user.id} AND "data" >= date_trunc('month', CURRENT_DATE) AND "data" < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' GROUP BY "tipo"`,
      sql`SELECT "nome", "valorMeta", "valorAtual", "dataMeta", "status" FROM "ObjetivoFinanceiro" WHERE "userId" = ${session.user.id} AND "status" = 'EM_ANDAMENTO' ORDER BY "dataMeta" ASC NULLS LAST LIMIT 8`,
    ]);

    const contextoPessoal = JSON.stringify({
      hoje: new Date().toISOString().slice(0, 10),
      proximosCompromissos: compromissos,
      resumoFinanceiroDoMes: resumoFinanceiro,
      objetivosEmAndamento: objetivos,
    });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const resposta = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      temperature: 0.4,
      max_completion_tokens: 700,
      user: session.user.id,
      messages: [
        {
          role: 'system',
          content: `Você é o assistente pessoal do Azimov. Responda em português do Brasil, de forma objetiva, acolhedora e prática. Use exclusivamente o contexto abaixo para falar sobre compromissos, finanças e objetivos. Não invente dados; se algo não estiver no contexto, informe claramente. Não mencione senhas ou dados que não estejam no contexto.\n\nCONTEXTO PESSOAL AUTORIZADO:\n${contextoPessoal}`,
        },
        ...historico,
      ],
    });

    return NextResponse.json({ resposta: resposta.choices[0]?.message?.content || 'Não consegui gerar uma resposta agora. Tente novamente.' });
  } catch (error) {
    console.error('Erro no assistente Groq:', error);
    return NextResponse.json({ error: 'Não foi possível responder agora. Tente novamente.' }, { status: 500 });
  }
}
