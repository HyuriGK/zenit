import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@/lib/neon';
import { isAdminEmail } from '@/lib/admin';

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

    const userId = session.user.id;
    const admin = isAdminEmail(session.user.email);
    const [agendaRecente, agendaFutura, resumoMensal, transacoesRelevantes, contas, objetivos, agendaDeUsuarios, contasDeUsuarios] = await Promise.all([
      sql`SELECT "titulo", "data", "horaInicio", "horaFim", "categoria", "concluido" FROM "Compromisso" WHERE "userId" = ${userId} AND "data" >= CURRENT_DATE - INTERVAL '14 days' AND "data" < CURRENT_DATE ORDER BY "data" DESC, "horaInicio" DESC LIMIT 15`,
      sql`SELECT "titulo", "data", "horaInicio", "horaFim", "categoria", "concluido" FROM "Compromisso" WHERE "userId" = ${userId} AND "data" >= CURRENT_DATE AND "data" < CURRENT_DATE + INTERVAL '45 days' ORDER BY "data" ASC, "horaInicio" ASC LIMIT 30`,
      sql`SELECT to_char(date_trunc('month', "data"), 'YYYY-MM') AS "mes", "tipo", COUNT(*)::int AS "quantidade", COALESCE(SUM("valor"), 0)::float AS "total" FROM "Transacao" WHERE "userId" = ${userId} AND "data" >= date_trunc('month', CURRENT_DATE) - INTERVAL '11 months' AND "data" < date_trunc('month', CURRENT_DATE) + INTERVAL '7 months' GROUP BY 1, "tipo" ORDER BY "mes" ASC`,
      sql`SELECT "descricao", "valor", "data", "tipo", "isFixa", "isParcela" FROM "Transacao" WHERE "userId" = ${userId} AND "data" >= CURRENT_DATE - INTERVAL '60 days' AND "data" < CURRENT_DATE + INTERVAL '180 days' ORDER BY "data" DESC LIMIT 60`,
      sql`SELECT "nome", "tipo", "saldoAtual", "ativa" FROM "ContaBancaria" WHERE "userId" = ${userId} AND "ativa" = true ORDER BY "nome" ASC LIMIT 12`,
      sql`SELECT "nome", "valorMeta", "valorAtual", "dataMeta", "status" FROM "ObjetivoFinanceiro" WHERE "userId" = ${userId} ORDER BY "status" ASC, "dataMeta" ASC NULLS LAST LIMIT 12`,
      admin ? sql`SELECT u."name" AS "usuario", u."email" AS "email", c."titulo", c."data", c."horaInicio", c."horaFim", c."categoria", c."concluido" FROM "Compromisso" c INNER JOIN "User" u ON u."id" = c."userId" WHERE c."data" >= CURRENT_DATE - INTERVAL '14 days' AND c."data" < CURRENT_DATE + INTERVAL '45 days' ORDER BY c."data" ASC, c."horaInicio" ASC LIMIT 120` : Promise.resolve([]),
      admin ? sql`SELECT u."name" AS "usuario", u."email" AS "email", cb."nome", cb."tipo", cb."saldoAtual", cb."ativa" FROM "ContaBancaria" cb INNER JOIN "User" u ON u."id" = cb."userId" WHERE cb."ativa" = true ORDER BY u."name" ASC, cb."nome" ASC LIMIT 120` : Promise.resolve([]),
    ]);

    const contextoPessoal = JSON.stringify({
      dataDeHoje: new Date().toISOString().slice(0, 10),
      agenda: { compromissosConcluidosOuRecentes: agendaRecente, proximos45Dias: agendaFutura },
      financeiro: { resumoMensalDosUltimos12MesesEProximos6: resumoMensal, transacoesDosUltimos60EDosProximos180Dias: transacoesRelevantes, contasAtivas: contas, objetivos },
      ...(admin ? { dadosDeTodosOsUsuarios: { agenda: agendaDeUsuarios, contasFinanceiras: contasDeUsuarios } } : {}),
    });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const resposta = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b', temperature: 0.35, max_completion_tokens: 850, user: userId,
      messages: [{
        role: 'system',
        content: `Você é o assistente pessoal do Azimov. Responda em português do Brasil, com tom direto, útil e acolhedor. Use o contexto para analisar agenda/planner, finanças e objetivos, incluindo meses específicos solicitados pelo usuário. Faça cálculos simples quando necessário e destaque datas, valores e próximos passos. Não invente informações nem diga que não tem acesso quando o dado estiver no contexto. Se o período pedido não tiver registros, informe isso claramente. Nunca mencione senhas ou dados fora do contexto. ${admin ? 'Este usuário é administrador: ele pode consultar os dados de agenda e contas financeiras de todos os usuários presentes no contexto. Identifique sempre o usuário ao apresentar dados de terceiros.' : 'Nunca mencione dados de outros usuários.'} Formate a resposta em Markdown simples: títulos curtos com **negrito**, listas com hífen e parágrafos curtos.\n\nCONTEXTO AUTORIZADO:\n${contextoPessoal}`,
      }, ...historico],
    });
    return NextResponse.json({ resposta: resposta.choices[0]?.message?.content || 'Não consegui gerar uma resposta agora. Tente novamente.' });
  } catch (error) {
    console.error('Erro no assistente Groq:', error);
    return NextResponse.json({ error: 'Não foi possível responder agora. Tente novamente.' }, { status: 500 });
  }
}
