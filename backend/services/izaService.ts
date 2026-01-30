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

/**
 * Utility function to create a delay (sleep) in asynchronous operations.
 * Used primarily for rate limit backoff strategies.
 * @param ms Duration in milliseconds to wait.
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Analyzes a citizen's manifestation text using Google's Gemini AI.
 * 
 * This service performs the following steps:
 * 1. Validates input length to avoid unnecessary API calls.
 * 2. Constructs a structured prompt instructing the AI to act as an Ombudsman.
 * 3. Sends the request to the `gemini-3-flash-preview` model.
 * 4. Parses the JSON response to extract the suggested category and reasoning.
 * 5. Implements a robust retry mechanism with exponential backoff for handling Rate Limits (429).
 * 
 * @param text The content of the manifestation reported by the citizen.
 * @param userType The category initially selected by the user (for comparison).
 * @returns {Promise<AnalysisResult>} A structured result containing the suggestion and logic.
 */
export const analyzeManifestation = async (text: string, userType: string): Promise<AnalysisResult> => {
    // Optimization: Skip analysis for very short texts to save tokens and reduce latency.
    if (text.length < 10) {
        return { originalType: userType, suggestedType: userType, matches: true, reasoning: 'Texto muito curto.' };
    }

    const validTypes = ['Denúncia', 'Reclamação', 'Sugestão', 'Elogio', 'Informação'];

    /**
     * Prompt Engineering:
     * - Persona: Defines the AI as "IZA", the Ombudsman AI.
     * - Task: Classify the text into one of the valid types.
     * - Constraints: Output MUST be strict JSON to ensure programmatic parsing.
     */
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

    // Retry Loop for Robustness
    while (attempt < maxRetries) {
        attempt++;
        try {
            console.log(`IZA AI: Tentativa ${attempt}/${maxRetries}...`);

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const textResponse = response.text();

            // Sanitize Response: Remove potential markdown code blocks (```json ... ```)
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
            // Error Handling Strategy: Check for Rate Limits (429)
            const isRateLimitError = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota');

            if (isRateLimitError && attempt < maxRetries) {
                // Intelligent Backoff: Use the 'Retry-After' header if provided, otherwise default to 60s
                let waitTime = 60000; // 60 seconds default base path

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

            // Fail gracefully only after exhausting all retries
            if (attempt >= maxRetries) {
                console.error('IZA AI: Todas as tentativas falharam.');
                return {
                    originalType: userType,
                    suggestedType: userType, // Fallback to user's original choice
                    matches: true,
                    reasoning: 'Erro na análise IA após múltiplas tentativas.'
                };
            }
        }
    }

    // Fallback Code (Code Unreachable under normal logic, but typesafe)
    return {
        originalType: userType,
        suggestedType: userType,
        matches: true,
        reasoning: 'Erro inesperado na análise IA.'
    };
};
