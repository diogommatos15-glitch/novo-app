import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, userGoals } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL da imagem é obrigatória' },
        { status: 400 }
      );
    }

    // Inicializa OpenAI (a chave será configurada pelo usuário)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Chave da API OpenAI não configurada' },
        { status: 500 }
      );
    }

    // Prompt personalizado baseado nos objetivos do usuário
    const systemPrompt = `Você é um nutricionista especializado em análise de alimentos. 
    Analise a imagem da refeição e forneça:
    1. Identificação dos alimentos presentes
    2. Estimativa de calorias totais
    3. Macronutrientes (proteínas, carboidratos, gorduras em gramas)
    4. Avaliação nutricional (saudável, moderado, não recomendado)
    5. Sugestões de melhoria
    ${userGoals ? `6. Compatibilidade com o objetivo: ${userGoals}` : ''}
    
    Seja preciso, profissional e motivador. Responda em português.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analise esta refeição detalhadamente:',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const analysis = response.choices[0]?.message?.content;

    if (!analysis) {
      return NextResponse.json(
        { error: 'Não foi possível analisar a imagem' },
        { status: 500 }
      );
    }

    // Extrai informações estruturadas da análise
    const extractCalories = (text: string): number => {
      const match = text.match(/(\d+)\s*(?:kcal|calorias)/i);
      return match ? parseInt(match[1]) : 0;
    };

    const extractMacros = (text: string) => {
      const proteinMatch = text.match(/proteínas?:?\s*(\d+)/i);
      const carbsMatch = text.match(/carboidratos?:?\s*(\d+)/i);
      const fatsMatch = text.match(/gorduras?:?\s*(\d+)/i);

      return {
        protein: proteinMatch ? parseInt(proteinMatch[1]) : 0,
        carbs: carbsMatch ? parseInt(carbsMatch[1]) : 0,
        fats: fatsMatch ? parseInt(fatsMatch[1]) : 0,
      };
    };

    const calories = extractCalories(analysis);
    const macros = extractMacros(analysis);

    return NextResponse.json({
      success: true,
      analysis: {
        fullText: analysis,
        calories,
        macros,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Erro na análise:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar a imagem' },
      { status: 500 }
    );
  }
}
