import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "Imagem não fornecida" },
        { status: 400 }
      );
    }

    // Validação da chave API
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY não configurada");
      return NextResponse.json(
        { error: "Configuração da API ausente. Configure a chave OpenAI." },
        { status: 500 }
      );
    }

    // Chama a API do OpenAI Vision
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Você é um nutricionista especialista em análise de alimentos. Analise a imagem da refeição fornecida e retorne um JSON VÁLIDO com as seguintes informações DETALHADAS:

{
  "foodName": "Nome completo e descritivo do prato",
  "confidence": número de 0-100 (confiança na identificação),
  "mealType": "Café da Manhã/Almoço/Jantar/Lanche",
  "portionSize": "Pequena/Média/Grande (com estimativa em gramas)",
  
  "nutrition": {
    "calories": número estimado de calorias,
    "protein": gramas de proteína,
    "carbs": gramas de carboidratos,
    "fat": gramas de gordura,
    "fiber": gramas de fibra,
    "sugar": gramas de açúcar,
    "sodium": miligramas de sódio,
    "cholesterol": miligramas de colesterol,
    "potassium": miligramas de potássio (opcional),
    "calcium": miligramas de cálcio (opcional),
    "iron": miligramas de ferro (opcional),
    "vitaminC": miligramas de vitamina C (opcional)
  },
  
  "ingredients": [
    {
      "name": "Nome do ingrediente",
      "amount": "Quantidade estimada",
      "calories": calorias do ingrediente,
      "benefits": "Benefícios nutricionais"
    }
  ],
  
  "scores": {
    "overall": pontuação geral 0-100,
    "protein": pontuação de proteína 0-100,
    "carbs": pontuação de carboidratos 0-100,
    "fat": pontuação de gordura 0-100,
    "micronutrients": pontuação de micronutrientes 0-100,
    "balance": pontuação de equilíbrio 0-100
  },
  
  "quality": {
    "level": "Excelente/Boa/Regular/Ruim",
    "color": "emerald/blue/yellow/red",
    "description": "Descrição da qualidade nutricional"
  },
  
  "goalImpact": {
    "alignment": porcentagem 0-100,
    "message": "Mensagem sobre alinhamento com objetivo de emagrecimento",
    "caloriesFit": "Avaliação das calorias",
    "proteinBonus": "Informação sobre proteína (opcional)"
  },
  
  "healthBenefits": [
    "Lista de benefícios para saúde"
  ],
  
  "recommendations": [
    {
      "type": "positive/tip/timing/hydration",
      "icon": "emoji apropriado",
      "text": "Recomendação personalizada"
    }
  ],
  
  "improvements": [
    "Sugestões de como melhorar a refeição"
  ],
  
  "dailyGoalsComparison": {
    "calories": { "consumed": valor, "goal": 1800, "percentage": porcentagem },
    "protein": { "consumed": valor, "goal": 120, "percentage": porcentagem },
    "carbs": { "consumed": valor, "goal": 180, "percentage": porcentagem },
    "fat": { "consumed": valor, "goal": 50, "percentage": porcentagem }
  },
  
  "nextMealSuggestion": {
    "time": "tempo até próxima refeição",
    "type": "tipo de refeição",
    "suggestion": "sugestão específica"
  },
  
  "glycemicInfo": {
    "index": "Alto/Médio/Baixo",
    "impact": "Descrição do impacto glicêmico"
  }
}

IMPORTANTE: 
- Seja PRECISO na identificação dos alimentos
- Estime porções de forma REALISTA
- Calcule valores nutricionais PRECISOS baseado nos ingredientes visíveis
- Identifique TODOS os ingredientes principais visíveis
- Dê recomendações PERSONALIZADAS e ÚTEIS
- Considere objetivo de emagrecimento nas análises
- Retorne APENAS o JSON, sem texto adicional`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise esta refeição em detalhes e forneça informações nutricionais completas e precisas.",
              },
              {
                type: "image_url",
                image_url: {
                  url: image,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Erro da API OpenAI:", errorData);
      
      // Mensagens de erro mais específicas
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Chave API inválida. Verifique sua configuração." },
          { status: 401 }
        );
      }
      
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Limite de requisições atingido. Tente novamente em alguns instantes." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `Erro ao analisar imagem: ${errorData.error?.message || 'Erro desconhecido'}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error("Resposta vazia da IA");
      return NextResponse.json(
        { error: "Resposta vazia da IA. Tente novamente." },
        { status: 500 }
      );
    }

    // Parse do JSON retornado pela IA
    let analysis;
    try {
      // Remove possíveis marcadores de código markdown
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Erro ao fazer parse do JSON:", parseError);
      console.error("Conteúdo recebido:", content);
      return NextResponse.json(
        { error: "Erro ao processar resposta da IA. A imagem pode não conter alimentos reconhecíveis." },
        { status: 500 }
      );
    }

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error("Erro na análise de alimentos:", error);
    
    // Tratamento de erros de rede
    if (error.message?.includes("fetch")) {
      return NextResponse.json(
        { error: "Erro de conexão com o servidor. Verifique sua internet." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno ao processar análise. Tente novamente." },
      { status: 500 }
    );
  }
}
