// Verificar se a API key está configurada
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY não está configurada no .env");
}

export type OutputFormat = 'padrao' | 'notion';

interface TranscribeAudioParams {
  audioUrl: string;
  userName?: string | null;
  formato?: OutputFormat;
}

interface TranscriptionResult {
  title: string;
  content: string; // Resumo organizado
  transcricaoOriginal: string; // Transcrição completa
}

/**
 * Transcreve áudio usando Gemini e gera um resumo organizado
 *
 * O Gemini 2.5 Flash suporta entrada de áudio diretamente via URL
 * ou base64. Usamos URL quando possível para evitar transferir
 * grandes quantidades de dados.
 */
export async function transcribeAudio({
  audioUrl,
  userName,
  formato = 'padrao',
}: TranscribeAudioParams): Promise<TranscriptionResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não configurada");
  }

  // Primeiro, baixamos o áudio e convertemos para base64
  // (Gemini precisa do áudio inline para processar)
  console.log("🔄 Baixando áudio para processamento...");

  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error(`Erro ao baixar áudio: ${audioResponse.status}`);
  }

  const audioBuffer = await audioResponse.arrayBuffer();
  const audioBase64 = Buffer.from(audioBuffer).toString('base64');

  // Detectar o tipo MIME do áudio e normalizar para formato aceito pelo Gemini
  let contentType = audioResponse.headers.get('content-type') || 'audio/webm';

  // Normalizar mime types com codecs para o formato base (Gemini não aceita codecs no mime_type)
  // Ex: "audio/webm;codecs=opus" -> "audio/webm"
  if (contentType.includes(';')) {
    contentType = contentType.split(';')[0].trim();
  }

  console.log(`📊 Áudio baixado: ${(audioBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB, tipo: ${contentType}`);

  // Prompt para transcrição e organização
  const promptPadrao = `Você é um assistente que ajuda a transcrever e organizar anotações de áudio.

TAREFA 1 - TRANSCRIÇÃO:
Primeiro, transcreva completamente o áudio fornecido. Capture todas as palavras ditas, mantendo a fidelidade ao conteúdo original. Se houver partes inaudíveis, indique com [inaudível].

TAREFA 2 - RESUMO ORGANIZADO:
Com base na transcrição, crie uma anotação ORGANIZADA e BEM ESTRUTURADA.

O resumo deve:
- Organizar as informações de forma lógica e coesa
- Manter TODAS as informações importantes do áudio original
- MANTER A MESMA PERSPECTIVA/TOM (se falado em primeira pessoa, mantenha em primeira pessoa)
- Usar parágrafos bem estruturados
- Não usar títulos ou subtítulos, apenas texto corrido em parágrafos
- Começar direto no conteúdo, sem introduções genéricas
- Parecer natural, como anotações de estudo bem organizadas
- Ter no máximo 800 palavras

IMPORTANTE: Responda APENAS com um JSON válido no seguinte formato, sem nenhum texto adicional:
{
  "title": "Um título curto e descritivo (máximo 60 caracteres)",
  "content": "O resumo organizado da anotação",
  "transcricaoOriginal": "A transcrição completa do áudio"
}

Não inclua markdown, código ou formatação no JSON. Apenas o JSON puro.`;

  const promptNotion = `Você é ${userName || "um estudante"} que está transcrevendo suas anotações de áudio para o Notion.

TAREFA 1 - TRANSCRIÇÃO:
Primeiro, transcreva completamente o áudio fornecido. Capture todas as palavras ditas, mantendo a fidelidade ao conteúdo original. Se houver partes inaudíveis, indique com [inaudível].

TAREFA 2 - RESUMO FORMATADO PARA NOTION:
Com base na transcrição, crie uma anotação ORGANIZADA e BEM ESTRUTURADA em primeira pessoa, formatada para copiar e colar diretamente no Notion.

O resumo deve:
- Organizar as informações de forma lógica e coesa
- Manter TODAS as informações importantes do áudio original
- Usar formatação Markdown compatível com o Notion:
  - Use ## para títulos de seções principais
  - Use ### para subtítulos quando necessário
  - Use **texto** para negrito em termos importantes
  - Use listas com - para bullet points quando apropriado
  - Use listas numeradas 1. 2. 3. quando houver sequência ou passos
  - Use > para citações ou destaques importantes
  - Deixe linhas em branco entre seções para boa legibilidade
- Ser clara e fácil de revisar posteriormente
- Começar direto no conteúdo
- Ter no máximo 800 palavras

IMPORTANTE: Responda APENAS com um JSON válido no seguinte formato:
{
  "title": "Um título curto e descritivo (máximo 60 caracteres)",
  "content": "O resumo organizado com formatação Markdown para Notion",
  "transcricaoOriginal": "A transcrição completa do áudio"
}

Retorne apenas o JSON puro, mas o campo content DEVE conter a formatação Markdown.`;

  const prompt = formato === 'notion' ? promptNotion : promptPadrao;

  try {
    console.log("🔄 Enviando áudio para Gemini...");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: contentType,
                    data: audioBase64,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 16384, // Maior limite para incluir transcrição completa
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Erro na API do Gemini:", errorData);

      // Verificar erros específicos
      const errorMessage = errorData?.error?.message || `Erro HTTP ${response.status}`;

      if (response.status === 400 && errorMessage.includes('audio')) {
        throw new Error("Formato de áudio não suportado pelo Gemini. Tente converter para MP3 ou WAV.");
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error("❌ Resposta inesperada da API:", JSON.stringify(data));

      // Verificar se foi bloqueado por segurança
      if (data.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error("O conteúdo do áudio foi bloqueado pelos filtros de segurança.");
      }

      throw new Error("Resposta inválida da API");
    }

    const responseText = data.candidates[0].content.parts[0].text;
    console.log("✅ Áudio transcrito via Gemini!");

    // Tentar fazer parse do JSON
    try {
      // Limpar possíveis caracteres extras
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedResponse);

      if (!parsed.title || !parsed.content || !parsed.transcricaoOriginal) {
        throw new Error("JSON inválido: campos obrigatórios ausentes");
      }

      return {
        title: parsed.title.substring(0, 60),
        content: parsed.content,
        transcricaoOriginal: parsed.transcricaoOriginal,
      };
    } catch (parseError) {
      console.error("❌ Erro ao fazer parse do JSON:", parseError);
      console.error("❌ Resposta recebida:", responseText.substring(0, 500));

      // Verificar se a resposta foi cortada
      const finishReason = data.candidates?.[0]?.finishReason;
      if (finishReason === "MAX_TOKENS") {
        throw new Error("O áudio é muito longo. Tente com uma gravação mais curta.");
      }

      throw new Error("Não foi possível processar a resposta da IA. Tente novamente.");
    }
  } catch (error) {
    console.error("Erro ao transcrever áudio com Gemini:", error);

    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

    if (errorMessage.includes("API key") || errorMessage.includes("API_KEY")) {
      throw new Error("API Key do Gemini inválida ou não configurada.");
    }
    if (errorMessage.includes("quota") || errorMessage.includes("limit")) {
      throw new Error("Limite de requisições do Gemini atingido. Tente novamente em alguns minutos.");
    }
    if (errorMessage.includes("404")) {
      throw new Error("Modelo não encontrado. Verifique sua API Key.");
    }

    throw new Error(errorMessage || "Não foi possível transcrever o áudio. Tente novamente.");
  }
}
