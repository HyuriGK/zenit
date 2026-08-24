import Groq from 'groq-sdk';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

type MensagemRecebida = {
  papel?: unknown;
  texto?: unknown;
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'A integração com a Groq ainda não foi configurada.' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const mensagens = Array.isArray(body?.mensagens) ? body.mensagens : [];
    const historico = mensagens
      .filter((mensagem: MensagemRecebida) =>
        (mensagem.papel === 'usuario' || mensagem.papel === 'assistente') &&
        typeof mensagem.texto === 'string' && mensagem.texto.trim().length > 0
      )
      .slice(-16)
      .map((mensagem: MensagemRecebida) => ({
        role: mensagem.papel === 'usuario' ? 'user' as const : 'assistant' as const,
        content: (mensagem.texto as string).trim().slice(0, 4000),
      }));

    if (!historico.length) return NextResponse.json({ error: 'Envie uma mensagem para iniciar a conversa.' }, { status: 400 });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const resposta = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      temperature: 0.4,
      max_completion_tokens: 700,
      user: session.user.id,
      messages: [
        {
          role: 'system',
          content: 'Você é o assistente pessoal do Azimov. Responda em português do Brasil, de forma objetiva, acolhedora e prática. Ainda não recebeu dados pessoais ou financeiros do usuário: não invente registros, valores ou compromissos. Quando for necessário consultar dados, explique qual informação ou permissão será necessária.',
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
