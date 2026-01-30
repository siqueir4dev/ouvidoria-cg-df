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

    // Ensure uploads directory exists
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    fastify.post('/manifestations', async (request, reply) => {
        const parts = request.parts();

        const body: any = {
            imageCount: 0,
            hasAudio: false,
            hasVideo: false
        };

        const savedFiles: { path: string, type: string }[] = [];

        try {
            for await (const part of parts) {
                if (part.type === 'file') {
                    // It's a file
                    const timestamp = Date.now();
                    const safeFilename = `${timestamp}-${part.filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                    const targetPath = path.join(uploadDir, safeFilename);

                    await pump(part.file, fs.createWriteStream(targetPath));

                    savedFiles.push({
                        path: safeFilename, // Relative to uploads dir
                        type: part.mimetype
                    });

                    // Update flags based on mimetype
                    if (part.mimetype.startsWith('audio/')) body.hasAudio = true;
                    if (part.mimetype.startsWith('video/')) body.hasVideo = true;
                    if (part.mimetype.startsWith('image/')) body.imageCount++;

                } else {
                    // It's a field
                    // Handle potential boolean strings
                    if (part.value === 'true') body[part.fieldname] = true;
                    else if (part.value === 'false') body[part.fieldname] = false;
                    else body[part.fieldname] = part.value;
                }
            }

            // ** AI INTERCEPTION **
            if (body.analyzeOnly) {
                // Delete uploaded files if it's just an analysis?
                // For now we keep them or we could delete them. Let's delete to save space/privacy.
                for (const file of savedFiles) {
                    try { fs.unlinkSync(path.join(uploadDir, file.path)); } catch (e) { }
                }

                const analysis = await analyzeManifestation(body.text, body.type || 'Informação');
                return {
                    status: 'analysis',
                    ...analysis
                };
            }

            const protocol = `DF-2026-${Math.floor(Math.random() * 1000000)}`;

            // Insert Manifestation (Supports both Anonymous and Identified)
            const [result] = await pool.query<ResultSetHeader>(
                `INSERT INTO manifestations (protocol, text, type, is_anonymous, has_audio, image_count, has_video, status, latitude, longitude, name, cpf) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                    body.isAnonymous === true ? null : (body.cpf || null)
                ]
            );

            const manifestationId = result.insertId;

            // Insert Attachments
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
            // Fetch Manifestation
            const [rows] = await pool.query<RowDataPacket[]>(
                'SELECT * FROM manifestations WHERE protocol = ?',
                [protocol]
            );

            if (rows.length === 0) {
                reply.code(404).send({ error: 'Protocolo não encontrado.' });
                return;
            }

            const manifestation = rows[0];

            // Fetch Attachments
            const [attachments] = await pool.query<RowDataPacket[]>(
                'SELECT file_path, file_type FROM attachments WHERE manifestation_id = ?',
                [manifestation.id]
            );

            // Fetch Responses
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
}
