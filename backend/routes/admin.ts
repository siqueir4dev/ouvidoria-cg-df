import { FastifyInstance } from 'fastify';
import pool from '../db';
import { authenticateToken } from '../middleware';

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
