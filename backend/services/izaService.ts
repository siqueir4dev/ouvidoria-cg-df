import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

interface AnalysisResult {
    originalType: string;
    suggestedType: string;
    matches: boolean;
    reasoning: string;
}

export const analyzeManifestation = async (text: string, userType: string): Promise<AnalysisResult> => {
    // If text is too short, skip analysis to save tokens/time
    if (text.length < 10) {
        return { originalType: userType, suggestedType: userType, matches: true, reasoning: 'Texto muito curto.' };
    }

    const validTypes = ['Denúncia', 'Reclamação', 'Sugestão', 'Elogio', 'Informação'];

    const prompt = `
    Você é a IZA, a inteligência artificial da Ouvidoria do DF.
    Sua missão é classificar corretamente as manifestações dos cidadãos.
    
    Analise o seguinte relato de um cidadão e identifique qual a categoria mais adequada para ele.
    NÃO seja influenciada por escolhas anteriores.
    
    Relato: "${text}"
    
    Tipos Válidos: ${validTypes.join(', ')}.
    
    Responda APENAS um JSON no seguinte formato (sem markdown):
    {
        "suggestedType": "Tipo Correto Aqui",
        "reasoning": "Breve explicação do porquê (max 1 frase) falando diretamente com o cidadão."
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        // Clean markdown if present
        const jsonStr = textResponse.replace(/^```json/, '').replace(/```$/, '').trim();
        const data = JSON.parse(jsonStr);

        const suggestedType = data.suggestedType;
        const matches = suggestedType.toLowerCase() === userType.toLowerCase();

        return {
            originalType: userType,
            suggestedType,
            matches,
            reasoning: data.reasoning
        };

    } catch (error) {
        console.error('IZA AI Error:', error);
        // Fail safe: assume it matches
        return {
            originalType: userType,
            suggestedType: userType,
            matches: true,
            reasoning: 'Erro na análise IA.'
        };
    }
};
