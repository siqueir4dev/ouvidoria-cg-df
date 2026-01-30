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
 * Função utilitária para criar um atraso (sleep) em operações assíncronas.
 * Usada principalmente para estratégias de espera em rate limits.
 * @param ms Duração em milissegundos para esperar.
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Analisa o texto de manifestação de um cidadão usando a IA Gemini do Google.
 * 
 * Este serviço realiza os seguintes passos:
 * 1. Valida o tamanho da entrada para evitar chamadas desnecessárias à API.
 * 2. Constrói um prompt estruturado instruindo a IA a agir como um Ouvidor.
 * 3. Envia a requisição para o modelo `gemini-3-flash-preview`.
 * 4. Analisa a resposta JSON para extrair a categoria sugerida e a justificativa.
 * 5. Implementa um mecanismo robusto de tentativas com backoff exponencial para lidar com Limites de Taxa (429).
 * 
 * @param text O conteúdo da manifestação relatada pelo cidadão.
 * @param userType A categoria inicialmente selecionada pelo usuário (para comparação).
 * @returns {Promise<AnalysisResult>} Um resultado estruturado contendo a sugestão e a lógica.
 */
export const analyzeManifestation = async (text: string, userType: string): Promise<AnalysisResult> => {
    // Otimização: Pula a análise para textos muito curtos para economizar tokens e reduzir latência.
    if (text.length < 10) {
        return { originalType: userType, suggestedType: userType, matches: true, reasoning: 'Texto muito curto.' };
    }

    const validTypes = ['Denúncia', 'Reclamação', 'Sugestão', 'Elogio', 'Informação'];

    /**
     * Engenharia de Prompt:
     * - Persona: Define a IA como "IZA", a IA da Ouvidoria.
     * - Tarefa: Classificar o texto em um dos tipos válidos.
     * - Restrições: A saída DEVE ser um JSON estrito para garantir a análise programática.
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

    // Loop de Tentativa para Robustez
    while (attempt < maxRetries) {
        attempt++;
        try {
            console.log(`IZA AI: Tentativa ${attempt}/${maxRetries}...`);

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const textResponse = response.text();

            // Sanitizar Resposta: Remove possíveis blocos de código markdown (```json ... ```)
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
            // Estratégia de Tratamento de Erro: Verifica por Limites de Taxa (429)
            const isRateLimitError = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota');

            if (isRateLimitError && attempt < maxRetries) {
                // Backoff Inteligente: Usa o cabeçalho 'Retry-After' se fornecido, caso contrário, padrão de 60s
                let waitTime = 60000; // Caminho base padrão de 60 segundos

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

            // Falha graciosamente apenas após esgotar todas as tentativas
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

    // Código de Fallback (Código inalcançável sob lógica normal, mas seguro para tipos)
    return {
        originalType: userType,
        suggestedType: userType,
        matches: true,
        reasoning: 'Erro inesperado na análise IA.'
    };
};
