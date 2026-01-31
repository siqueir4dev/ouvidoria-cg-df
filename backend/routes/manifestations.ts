import { FastifyInstance } from 'fastify';
import pool from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { analyzeManifestation } from '../services/izaService';
import fs from 'fs';
import path from 'path';
import util from 'util';
import { pipeline } from 'stream';

const pump = util.promisify(pipeline);

export async function manifestRoutes(fastify: FastifyInstance) {

    // Garante que o diretório de uploads exista
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    /**
     * POST /manifestations
     * Lida com a criação de uma nova manifestação (relato).
     * Suporta 'multipart/form-data' para permitir uploads de arquivos (imagens, vídeos, áudio) junto com campos de texto.
     */
    fastify.post('/manifestations', async (request, reply) => {
        // 'request.parts()' retorna um iterador assíncrono para processar campos multipart sequencialmente.
        const parts = (request as any).parts();

        const body: any = {
            imageCount: 0,
            hasAudio: false,
            hasVideo: false
        };

        const savedFiles: { path: string, type: string }[] = [];

        try {
            // Itera sobre cada parte da requisição multipart
            for await (const part of parts) {
                if (part.type === 'file') {
                    // ** Segurança Crítica **: 
                    // Nós NÃO usamos o nome de arquivo original diretamente para evitar sobrescritas ou ataques de diretório.
                    // Em vez disso, prefixamos com um timestamp e substituímos caracteres potencialmente inseguros por underscores.
                    const timestamp = Date.now();
                    const safeFilename = `${timestamp}-${part.filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                    const targetPath = path.join(uploadDir, safeFilename);

                    // ** Processamento por Stream **:
                    // Usamos 'pump' (pipeline) para transmitir os dados do arquivo diretamente da requisição para o disco.
                    // Isso é eficiente em memória, pois não carrega o arquivo inteiro na RAM.
                    await pump(part.file, fs.createWriteStream(targetPath));

                    savedFiles.push({
                        path: safeFilename, // Relativo ao diretório uploads
                        type: part.mimetype
                    });

                    // Atualiza flags com base no mimetype para renderização rápida na UI posteriormente
                    if (part.mimetype.startsWith('audio/')) body.hasAudio = true;
                    if (part.mimetype.startsWith('video/')) body.hasVideo = true;
                    if (part.mimetype.startsWith('image/')) body.imageCount++;

                } else {
                    // É um campo de formulário comum (texto, booleano, etc.)
                    // Analisa manualmente strings 'true'/'false' em booleanos
                    if (part.value === 'true') body[part.fieldname] = true;
                    else if (part.value === 'false') body[part.fieldname] = false;
                    else body[part.fieldname] = part.value;
                }
            }

            // ** INTERCEPTAÇÃO PARA ANÁLISE DE IA **
            // Se o frontend solicitar 'analyzeOnly', pulamos a persistência no banco de dados.
            if (body.analyzeOnly) {
                // Excluir arquivos enviados se for apenas uma análise?
                // Por enquanto mantemos ou poderíamos excluir. Vamos excluir para economizar espaço/privacidade.
                for (const file of savedFiles) {
                    try { fs.unlinkSync(path.join(uploadDir, file.path)); } catch (e) { }
                }

                const analysis = await analyzeManifestation(body.text, body.type || 'Informação');
                return {
                    status: 'analysis',
                    ...analysis
                };
            }

            // --- AI PII ANALYSIS FOR PERSISTENCE ---
            // Even if not requested explicitly, we run the analysis to determine privacy.
            // Note: In a high-traffic production scenario, we might offload this to a background job.
            // For this MVP, we await it to set the flag immediately.
            let isPublic = false;
            let aiAnalysis = null;

            try {
                aiAnalysis = await analyzeManifestation(body.text, body.type || 'Informação');
                // Rule: It is public ONLY IF:
                // 1. User wants to be Anonymous (isAnonymous == true)
                // 2. AI did NOT find PII (hasPii == false)
                // 3. User didn't flag some other restriction (implied by isAnonymous)
                if (body.isAnonymous === true || body.isAnonymous === 'true') {
                    if (aiAnalysis && aiAnalysis.hasPii === false) {
                        isPublic = true;
                    }
                }
            } catch (e) {
                console.error('Failed to run AI analysis for persistence:', e);
                // Fail safe: stays private
            }
            // ---------------------------------------

            const protocol = `DF-2026-${Math.floor(Math.random() * 1000000)}`;

            // Insere Manifestação (Suporta Anônimo e Identificado)
            const [result] = await pool.query<ResultSetHeader>(
                `INSERT INTO manifestations (protocol, text, type, is_anonymous, has_audio, image_count, has_video, status, latitude, longitude, name, cpf, is_public, original_text, was_edited) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    protocol,
                    body.text || '',
                    body.type || 'Informação',
                    body.isAnonymous === true ? 1 : 0,
                    body.hasAudio ? 1 : 0,
                    body.imageCount,
                    body.hasVideo ? 1 : 0,
                    'received',
                    body.latitude || null,
                    body.longitude || null,
                    body.isAnonymous === true ? null : (body.name || null),
                    body.isAnonymous === true ? null : (body.cpf || null),
                    isPublic ? 1 : 0,
                    null, // original_text starts null
                    0 // was_edited starts false
                ]
            );

            const manifestationId = result.insertId;

            // Insere Anexos
            if (savedFiles.length > 0) {
                const attachmentValues = savedFiles.map(f => [manifestationId, f.path, f.type]);
                await pool.query(
                    `INSERT INTO attachments (manifestation_id, file_path, file_type) VALUES ?`,
                    [attachmentValues]
                );
            }

            console.log(`Manifestação salva: ${protocol} (ID: ${manifestationId}) with ${savedFiles.length} files.`);

            return {
                status: 'success',
                protocol: protocol,
                message: 'Manifestação registrada com sucesso.'
            };

        } catch (error) {
            console.error('Erro ao processar upload:', error);
            reply.code(500).send({ error: 'Erro interno ao salvar manifestação' });
        }
    });

    fastify.get('/manifestations/:protocol', async (request, reply) => {
        const { protocol } = request.params as { protocol: string };

        try {
            // Busca Manifestação
            const [rows] = await pool.query<RowDataPacket[]>(
                'SELECT * FROM manifestations WHERE protocol = ?',
                [protocol]
            );

            if (rows.length === 0) {
                reply.code(404).send({ error: 'Protocolo não encontrado.' });
                return;
            }

            const manifestation = rows[0];

            // Busca Anexos
            const [attachments] = await pool.query<RowDataPacket[]>(
                'SELECT file_path, file_type FROM attachments WHERE manifestation_id = ?',
                [manifestation.id]
            );

            // Busca Respostas
            const [responses] = await pool.query<RowDataPacket[]>(
                'SELECT message, created_at, is_admin FROM manifestation_responses WHERE manifestation_id = ? ORDER BY created_at ASC',
                [manifestation.id]
            );

            return {
                ...manifestation,
                attachments,
                responses
            };

        } catch (error) {
            console.error('Erro ao buscar protocolo:', error);
            reply.code(500).send({ error: 'Erro ao buscar dados.' });
        }
    });

    fastify.get('/status', async () => {
        return { status: 'online', service: 'Participa DF API (MySQL + Attachments)' };
    });

    /**
     * GET /manifestations/public
     * Returns a list of public manifestations for the homepage/feed.
     * Filtered by is_public = 1.
     */
    fastify.get('/manifestations/public', async (request, reply) => {
        try {
            const [rows] = await pool.query<RowDataPacket[]>(
                `SELECT id, text, type, created_at, was_edited 
                 FROM manifestations 
                 WHERE is_public = 1 
                 ORDER BY created_at DESC 
                 LIMIT 20`
            );
            return rows;
        } catch (error) {
            console.error('Erro ao buscar manifestações públicas:', error);
            reply.code(500).send({ error: 'Erro ao buscar dados.' });
        }
    });
}
