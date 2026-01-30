import { FastifyInstance } from 'fastify';
import pool from '../db';
import { authenticateToken } from '../middleware';
import fs from 'fs';
import path from 'path';

export default async function adminRoutes(fastify: FastifyInstance) {

    // Protect all routes in this plugin
    fastify.addHook('preHandler', authenticateToken);

    // Get Dashboard Statistics
    fastify.get('/stats', async (request, reply) => {
        try {
            const [totalRows] = await pool.query('SELECT COUNT(*) as count FROM manifestations');
            const [pendingRows] = await pool.query('SELECT COUNT(*) as count FROM manifestations WHERE status = "received"');
            const [typeRows] = await pool.query('SELECT type, COUNT(*) as count FROM manifestations GROUP BY type');

            // Last 7 days trend
            const [trendRows] = await pool.query(`
                SELECT DATE(created_at) as date, COUNT(*) as count 
                FROM manifestations 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
                GROUP BY DATE(created_at) 
                ORDER BY date ASC
            `);

            return {
                total: (totalRows as any)[0].count,
                pending: (pendingRows as any)[0].count,
                byType: typeRows,
                trend: trendRows
            };
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: 'Erro ao carregar estatísticas.' });
        }
    });

    // Get List of Manifestations (Paginated)
    fastify.get('/manifestations', async (request, reply) => {
        const { page = 1, limit = 10, status } = request.query as any;
        const offset = (page - 1) * limit;

        try {
            let query = 'SELECT * FROM manifestations';
            const params: any[] = [];

            if (status) {
                query += ' WHERE status = ?';
                params.push(status);
            }

            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(Number(limit), Number(offset));

            const [rows] = await pool.query(query, params);
            const [countResult] = await pool.query('SELECT COUNT(*) as total FROM manifestations' + (status ? ' WHERE status = ?' : ''), status ? [status] : []);

            return {
                data: rows,
                total: (countResult as any)[0].total,
                page: Number(page),
                totalPages: Math.ceil((countResult as any)[0].total / limit)
            };
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: 'Erro ao listar manifestações.' });
        }
    });

    // Get Single Manifestation with Attachments
    fastify.get('/manifestations/:id', async (request, reply) => {
        const { id } = request.params as any;

        try {
            const [rows] = await pool.query('SELECT * FROM manifestations WHERE id = ?', [id]);
            // @ts-ignore
            if (rows.length === 0) {
                return reply.status(404).send({ error: 'Manifestação não encontrada.' });
            }

            // @ts-ignore
            const manifestation = rows[0];

            // Get Attachments
            const [attachments] = await pool.query('SELECT * FROM attachments WHERE manifestation_id = ?', [id]);

            // Get History/Responses
            const [responses] = await pool.query('SELECT * FROM manifestation_responses WHERE manifestation_id = ? ORDER BY created_at ASC', [id]);

            return {
                ...manifestation,
                // @ts-ignore
                attachments: attachments,
                // @ts-ignore
                responses: responses
            };
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: 'Erro ao buscar detalhes da manifestação.' });
        }
    });

    // ** Secure Attachment Access **
    // GET /attachments/:id/file
    // Serves files (images, videos) related to a manifestation.
    // CRITICAL: This route is protected by 'verifyToken' (implied via fastify-auth middleware or manual check upstream).
    fastify.get('/attachments/:id/file', async (request, reply) => {
        const { id } = request.params as any;

        try {
            // 1. Verify file ownership/existence in database
            const [rows] = await pool.query('SELECT * FROM attachments WHERE id = ?', [id]);
            // @ts-ignore
            if (rows.length === 0) {
                return reply.status(404).send({ error: 'Anexo não encontrado.' });
            }

            // @ts-ignore
            const attachment = rows[0];
            const uploadDir = path.join(__dirname, '../../uploads');
            const filePath = path.join(uploadDir, attachment.file_path);

            // 2. Security Check: Ensure file physically exists to prevent information leak
            if (!fs.existsSync(filePath)) {
                return reply.status(404).send({ error: 'Arquivo físico não encontrado.' });
            }

            // 3. Serve via Stream
            // Streaming is preferred over reading the whole file into memory, especially for videos.
            const stream = fs.createReadStream(filePath);
            const type = attachment.file_type || 'application/octet-stream';

            reply.header('Content-Type', type);
            // inline means browser tries to view it, attachment means download
            // We use inline so images can be shown in the dashboard.
            reply.header('Content-Disposition', `inline; filename="${attachment.original_name}"`);

            return reply.send(stream);

        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: 'Erro ao ler arquivo.' });
        }
    });

    // Send Admin Reply
    fastify.post('/manifestations/:id/reply', async (request, reply) => {
        const { id } = request.params as any;
        const { message, status } = request.body as any; // Optional status update

        if (!message) return reply.status(400).send({ error: 'Mensagem obrigatória.' });

        try {
            await pool.query(
                'INSERT INTO manifestation_responses (manifestation_id, message, is_admin) VALUES (?, ?, true)',
                [id, message]
            );

            if (status) {
                await pool.query('UPDATE manifestations SET status = ? WHERE id = ?', [status, id]);
            }

            return { message: 'Resposta enviada com sucesso.' };
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: 'Erro ao enviar resposta.' });
        }
    });

    // Update Status (Triage)
    fastify.patch('/manifestations/:id/status', async (request, reply) => {
        const { id } = request.params as any;
        const { status } = request.body as any;

        if (!['received', 'in_analysis', 'resolved', 'archived'].includes(status)) {
            return reply.status(400).send({ error: 'Status inválido.' });
        }

        try {
            await pool.query('UPDATE manifestations SET status = ? WHERE id = ?', [status, id]);
            return { message: 'Status atualizado com sucesso.' };
        } catch (error) {
            console.error(error);
            return reply.status(500).send({ error: 'Erro ao atualizar status.' });
        }
    });
}
