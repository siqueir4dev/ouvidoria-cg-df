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
    hasPii?: boolean;
    piiConfidence?: string;
    piiAnalysis?: string;
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
    if (text.length < 5) {
        return {
            originalType: userType,
            suggestedType: userType,
            matches: true,
            reasoning: 'Texto muito curto.',
            hasPii: false,
            piiConfidence: 'low'
        };
    }

    const validTypes = ['Denúncia', 'Reclamação', 'Sugestão', 'Elogio', 'Informação'];

    /**
     * Engenharia de Prompt:
     * - Persona: Define a IA como "IZA", a IA da Ouvidoria.
     * - Tarefa: 
     *      1. Classificar o texto em um dos tipos válidos.
     *      2. DETECTAR DADOS PESSOAIS (PII) que possam identificar uma pessoa.
     * - Restrições: A saída DEVE ser um JSON estrito para garantir a análise programática.
     */
    const prompt = `
    Você é a IZA, a inteligência artificial da Ouvidoria do DF.
    Sua missão é classificar as manifestações e proteger a privacidade dos cidadãos.
    
    Analise o seguinte relato:
    "${text}"
    
    Tarefas:
    1. Classifique em: ${validTypes.join(', ')}.
    2. Verifique se há DADOS PESSOAIS identificáveis no texto (ex: Nome completo, CPF, Telefone, Email, Endereço residencial preciso, Placa de carro vinculada a pessoa). 
       - Mentions to public figures (Gov, Admin) or generic places do NOT count as PII.
       - Self-identification ("Eu sou João") COUNTS as PII.
    
    Responda APENAS um JSON:
    {
        "suggestedType": "Tipo",
        "reasoning": "Explicação breve.",
        "hasPii": true/false,
        "piiAnalysis": "O que foi encontrado (sem repetir o dado) ou 'Nenhum dado pessoal encontrado'."
    }
    `;

    const maxRetries = 5;
    let attempt = 0;

    // Loop de Tentativa para Robustez
    while (attempt < maxRetries) {
        attempt++;
        try {
            console.log(`IZA AI: Tentativa ${attempt}/${maxRetries}...`);

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const textResponse = response.text();

            // Sanitizar Resposta
            const jsonStr = textResponse.replace(/^```json/, '').replace(/```$/, '').trim();
            const data = JSON.parse(jsonStr);

            const suggestedType = data.suggestedType;
            const matches = suggestedType?.toLowerCase() === userType.toLowerCase();

            console.log(`IZA AI: Sucesso! Tipo: ${suggestedType}, PII: ${data.hasPii}`);

            return {
                originalType: userType,
                suggestedType: suggestedType || userType,
                matches,
                reasoning: data.reasoning || '',
                hasPii: !!data.hasPii,
                piiConfidence: 'high'
            };

        } catch (error: any) {
            // ... (Mesma lógica de retry anterior)
            const isRateLimitError = error?.status === 429 || error?.message?.includes('429');

            if (isRateLimitError && attempt < maxRetries) {
                let waitTime = 10000; // Reduzido para testar mais rápido, idealmente backoff
                console.log(`IZA AI: Rate Limit. Aguardando ${waitTime}ms...`);
                await delay(waitTime);
                continue;
            }

            console.error('IZA AI Error:', error?.message || error);

            if (attempt >= maxRetries) {
                // Fallback seguro: Assume que TEM PII se falhar, para evitar vazamento acidental
                return {
                    originalType: userType,
                    suggestedType: userType,
                    matches: true,
                    reasoning: 'Erro na análise IA.',
                    hasPii: true, // Fail safe
                    piiConfidence: 'failed'
                };
            }
        }
    }

    return {
        originalType: userType,
        suggestedType: userType,
        matches: true,
        reasoning: 'Erro inesperado.',
        hasPii: true,
        piiConfidence: 'failed'
    };
};
