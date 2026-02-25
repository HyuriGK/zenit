// Verificar se a API key está configurada
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY não está configurada no .env")
  throw new Error("GEMINI_API_KEY não configurada")
}

export type NoteFormat = 'padrao' | 'notion'

interface GenerateNoteParams {
  content: string
  userName?: string | null
  formato?: NoteFormat
}

export async function generateNote({
  content,
  userName,
  formato = 'padrao',
}: GenerateNoteParams): Promise<{ title: string; content: string }> {
  const promptPadrao = `Você está organizando anotações de estudo.

Com base no texto bruto abaixo (que pode ser transcrições, bullet points, notas rápidas ou qualquer tipo de anotação desorganizada), crie uma anotação ORGANIZADA e BEM ESTRUTURADA.

A anotação deve:
- Organizar as informações de forma lógica e coesa
- Manter TODAS as informações importantes do texto original
- MANTER A MESMA PERSPECTIVA/TOM do texto original (se estiver em primeira pessoa, mantenha em primeira pessoa; se estiver impessoal/imparcial, mantenha impessoal)
- Caso necessário, pular linhas para distinguir tópicos diferentes
- Ser clara e fácil de revisar posteriormente
- Usar parágrafos bem estruturados
- Não usar títulos ou subtítulos, apenas texto corrido em parágrafos
- Começar direto no conteúdo, sem introduções genéricas
- Parecer natural, como anotações de estudo bem organizadas
- Ter no máximo 800 palavras

Texto bruto para organizar:

${content}

IMPORTANTE: Responda APENAS com um JSON válido no seguinte formato, sem nenhum texto adicional antes ou depois:
{
  "title": "Um título curto e descritivo para a anotação (máximo 60 caracteres)",
  "content": "O conteúdo organizado da anotação"
}

Não inclua markdown, código ou qualquer formatação. Apenas o JSON puro.`

  const promptNotion = `Você é ${userName || "um estudante"} que está organizando suas anotações de estudo para o Notion.

Com base no texto bruto abaixo (que pode ser transcrições, bullet points, notas rápidas ou qualquer tipo de anotação desorganizada), crie uma anotação ORGANIZADA e BEM ESTRUTURADA em primeira pessoa, formatada para copiar e colar diretamente no Notion.

A anotação deve:
- Organizar as informações de forma lógica e coesa
- Manter TODAS as informações importantes do texto original
- Usar formatação Markdown compatível com o Notion:
  - Use ## para títulos de seções principais
  - Use ### para subtítulos quando necessário
  - Use **texto** para negrito em termos importantes
  - Use listas com - para bullet points quando apropriado
  - Use listas numeradas 1. 2. 3. quando houver sequência ou passos
  - Use > para citações ou destaques importantes
  - Deixe linhas em branco entre seções para boa legibilidade
- Ser clara e fácil de revisar posteriormente
- Começar direto no conteúdo, sem introduções genéricas como "Hoje eu..."
- Parecer natural, como anotações pessoais de estudo bem organizadas
- Ter no máximo 800 palavras

Texto bruto para organizar:

${content}

IMPORTANTE: Responda APENAS com um JSON válido no seguinte formato, sem nenhum texto adicional antes ou depois:
{
  "title": "Um título curto e descritivo para a anotação (máximo 60 caracteres)",
  "content": "O conteúdo organizado da anotação com formatação Markdown para Notion"
}

Retorne apenas o JSON puro, mas o campo content DEVE conter a formatação Markdown.`

  const prompt = formato === 'notion' ? promptNotion : promptPadrao

  try {
    console.log("🔄 Gerando anotação com IA...")

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
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("❌ Erro na API do Gemini:", errorData)
      throw new Error(errorData?.error?.message || `Erro HTTP ${response.status}`)
    }

    const data = await response.json()

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error("❌ Resposta inesperada da API:", JSON.stringify(data))
      throw new Error("Resposta inválida da API")
    }

    const responseText = data.candidates[0].content.parts[0].text
    console.log("✅ Anotação gerada via API REST!")

    // Tentar fazer parse do JSON
    try {
      // Limpar possíveis caracteres extras
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      const parsed = JSON.parse(cleanedResponse)

      if (!parsed.title || !parsed.content) {
        throw new Error("JSON inválido: campos obrigatórios ausentes")
      }

      return {
        title: parsed.title.substring(0, 60),
        content: parsed.content
      }
    } catch (parseError) {
      console.error("❌ Erro ao fazer parse do JSON:", parseError)
      console.error("❌ Resposta recebida:", responseText.substring(0, 500))

      // Verificar se o JSON foi cortado (resposta incompleta)
      const finishReason = data.candidates?.[0]?.finishReason
      if (finishReason === "MAX_TOKENS") {
        throw new Error("A resposta foi cortada por limite de tokens. Tente com um texto menor.")
      }

      throw new Error("Não foi possível processar a resposta da IA. Tente novamente.")
    }
  } catch (error) {
    console.error("Erro ao gerar anotação com Gemini:", error)

    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"

    if (errorMessage.includes("API key") || errorMessage.includes("API_KEY")) {
      throw new Error("API Key do Gemini inválida ou não configurada.")
    }
    if (errorMessage.includes("quota") || errorMessage.includes("limit")) {
      throw new Error("Limite de requisições do Gemini atingido. Tente novamente em alguns minutos.")
    }
    if (errorMessage.includes("404")) {
      throw new Error("Modelo não encontrado. Verifique sua API Key.")
    }

    throw new Error(errorMessage || "Não foi possível gerar a anotação. Tente novamente.")
  }
}
