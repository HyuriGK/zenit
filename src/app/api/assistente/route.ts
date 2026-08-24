import OpenAI from 'openai';
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

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'A integração com a OpenAI ainda não foi configurada.' }, { status: 503 });
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

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resposta = await openai.responses.create({
      model: 'gpt-5-mini',
      store: false,
      instructions: `Você é o assistente pessoal do Azimov. Responda em português do Brasil, de forma objetiva, acolhedora e prática. Ainda não recebeu dados pessoais ou financeiros do usuário: não invente registros, valores ou compromissos. Quando for necessário consultar dados, explique qual informação ou permissão será necessária.`,
      input: historico,
    });

    return NextResponse.json({ resposta: resposta.output_text || 'Não consegui gerar uma resposta agora. Tente novamente.' });
  } catch (error) {
    console.error('Erro no assistente Azimov:', error);
    return NextResponse.json({ error: 'Não foi possível responder agora. Tente novamente.' }, { status: 500 });
  }
}
