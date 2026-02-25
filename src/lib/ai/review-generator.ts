// Verificar se a API key está configurada
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY não está configurada no .env")
  throw new Error("GEMINI_API_KEY não configurada")
}

console.log("✅ GEMINI_API_KEY carregada:", process.env.GEMINI_API_KEY.substring(0, 10) + "...")

interface GenerateReviewParams {
  content: string
  pageType: "BOOK" | "MOVIE"
  metadata?: {
    title?: string
    author?: string
    director?: string
    [key: string]: string | number | boolean | undefined
  }
  userName?: string | null
}

interface GeminiModel {
  name: string
  [key: string]: unknown
}

export async function generateReview({
  content,
  pageType,
  metadata,
  userName,
}: GenerateReviewParams): Promise<string> {
  const itemTitle = metadata?.title || "esta obra"
  const creator = pageType === "BOOK"
    ? (metadata?.author ? ` de ${metadata.author}` : "")
    : (metadata?.director ? ` dirigido por ${metadata.director}` : "")

  const verb = pageType === "BOOK" ? "ler" : "assistir"
  const past = pageType === "BOOK" ? "leitura" : "filme"

  const prompt = `Você é ${userName || "um leitor/espectador"} que acabou de ${verb} "${itemTitle}"${creator}.

Com base nas suas anotações abaixo, escreva uma resenha COMPLETA e DETALHADA em primeira pessoa, como se você estivesse compartilhando sua experiência e impressões sobre ${pageType === "BOOK" ? "o livro" : "o filme"}.

A resenha deve:
- Ter no máximo 500 palavras
- Não deve conter - como separador de texto
- Ser escrita em primeira pessoa ("eu achei", "me impressionou", "senti que", "percebi")
- Ser COMPLETA, abordando TODOS os pontos mencionados nas anotações
- Refletir suas impressões e sentimentos sobre a obra de forma autêntica
- Mencionar e desenvolver CADA um dos elementos que você destacou nas suas anotações
- Ser pessoal e envolvente, como se você estivesse contando para um amigo
- Não usar títulos ou subtítulos, apenas texto corrido em parágrafos
- Começar direto falando da obra, sem introduções genéricas
- Ter profundidade e detalhes sobre as questões abordadas sobre o livro em si, não apenas uma visão superficial
- O final deve ser conclusivo, resumindo sua experiência com a ${past} e recomendando (ou não) a obra
- É importante que a resenha pareça natural e espontânea, como uma conversa entre amigos, e não um texto formal ou acadêmico.
- É vital que a conclusão seja clara e reflita sua opinião sincera sobre a ${past}.

Suas anotações sobre ${pageType === "BOOK" ? "o livro" : "o filme"}:

${content}

Escreva a resenha COMPLETA em português do Brasil, de forma natural, reflexiva e autêntica. Não economize nas palavras - quanto mais detalhada e completa, melhor!`

  try {
    console.log("🔄 Tentando usar API REST direta do Gemini...")

    // Listar modelos disponíveis primeiro
    const listResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`
    )

    if (listResponse.ok) {
      const models = await listResponse.json()
      console.log("📋 Modelos disponíveis:", models.models?.map((m: GeminiModel) => m.name).join(", "))
    }

    // Usar gemini-2.5-flash (modelo disponível na sua API key)
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
            temperature: 0.8,
            maxOutputTokens: 2048,
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

    const reviewText = data.candidates[0].content.parts[0].text
    console.log("✅ Resenha gerada via API REST!")

    return reviewText
  } catch (error) {
    console.error("Erro ao gerar resenha com Gemini:", error)

    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    const errorResponse = error && typeof error === "object" && "response" in error ? error.response : null

    // Logar detalhes do erro para debug
    if (errorResponse) {
      console.error("Resposta do erro:", errorResponse)
    }
    if (errorMessage) {
      console.error("Mensagem do erro:", errorMessage)
    }

    // Mensagens de erro mais específicas
    if (errorMessage.includes("API key") || errorMessage.includes("API_KEY")) {
      throw new Error("API Key do Gemini inválida ou não configurada.")
    }
    if (errorMessage.includes("quota") || errorMessage.includes("limit")) {
      throw new Error("Limite de requisições do Gemini atingido. Tente novamente em alguns minutos.")
    }
    if (errorMessage.includes("404")) {
      throw new Error("Modelo não encontrado. Verifique sua API Key.")
    }

    throw new Error(errorMessage || "Não foi possível gerar a resenha. Tente novamente.")
  }
}
