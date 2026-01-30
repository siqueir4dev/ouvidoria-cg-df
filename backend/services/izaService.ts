import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// Updated to gemini-3-flash-preview as requested
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

interface AnalysisResult {
    originalType: string;
    suggestedType: string;
    matches: boolean;
    reasoning: string;
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    const maxRetries = 10;
    let attempt = 0;

    while (attempt < maxRetries) {
        attempt++;
        try {
            console.log(`IZA AI: Tentativa ${attempt}/${maxRetries}...`);

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const textResponse = response.text();

            // Clean markdown if present
            const jsonStr = textResponse.replace(/^```json/, '').replace(/```$/, '').trim();
            const data = JSON.parse(jsonStr);

            const suggestedType = data.suggestedType;
            const matches = suggestedType.toLowerCase() === userType.toLowerCase();

            console.log(`IZA AI: Sucesso na tentativa ${attempt}!`);

            return {
                originalType: userType,
                suggestedType,
                matches,
                reasoning: data.reasoning
            };

        } catch (error: any) {
            const isRateLimitError = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota');

            if (isRateLimitError && attempt < maxRetries) {
                // Extract retry delay from error if available, default to 60 seconds
                let waitTime = 60000; // 60 seconds default

                if (error?.errorDetails) {
                    const retryInfo = error.errorDetails.find((d: any) => d['@type']?.includes('RetryInfo'));
                    if (retryInfo?.retryDelay) {
                        const seconds = parseInt(retryInfo.retryDelay.replace('s', ''));
                        if (!isNaN(seconds)) {
                            waitTime = (seconds + 5) * 1000; // Add 5 seconds buffer
                        }
                    }
                }

                console.log(`IZA AI: Limite de cota atingido. Aguardando ${Math.round(waitTime / 1000)}s antes de tentar novamente...`);
                await delay(waitTime);
                continue;
            }

            console.error('IZA AI Error:', error?.message || error);

            // Only fail after all retries exhausted
            if (attempt >= maxRetries) {
                console.error('IZA AI: Todas as tentativas falharam.');
                return {
                    originalType: userType,
                    suggestedType: userType,
                    matches: true,
                    reasoning: 'Erro na análise IA após múltiplas tentativas.'
                };
            }
        }
    }

    // Fallback (should not reach here)
    return {
        originalType: userType,
        suggestedType: userType,
        matches: true,
        reasoning: 'Erro inesperado na análise IA.'
    };
};
