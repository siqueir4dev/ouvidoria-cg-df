import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';
import rateLimit from '@fastify/rate-limit';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_prod';

export default async function authRoutes(fastify: FastifyInstance) {

    // Rate Limiting for Login: Max 5 attempts per 1 minute
    await fastify.register(rateLimit, {
        max: 5,
        timeWindow: '1 minute',
        errorResponseBuilder: () => ({ error: 'Muitas tentativas de login. Tente novamente em 1 minuto.' })
    });

    fastify.post('/login', async (request, reply) => {
        const { username, password } = request.body as any;

        if (!username || !password) {
            return reply.status(400).send({ error: 'Usuário e senha são obrigatórios.' });
        }

        try {
            const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
            const admins = rows as any[];

            if (admins.length === 0) {
                // Use dummy comparison to prevent timing attacks
                await bcrypt.compare(password, '$2b$10$abcdefghijklmnopqrstuvwxyz123456');
                return reply.status(401).send({ error: 'Credenciais inválidas.' });
            }

            const admin = admins[0];
            const match = await bcrypt.compare(password, admin.password_hash);

            if (!match) {
                return reply.status(401).send({ error: 'Credenciais inválidas.' });
            }

            // Generate Token
            const token = jwt.sign(
                { id: admin.id, username: admin.username, role: admin.role },
                JWT_SECRET,
                { expiresIn: '8h' }
            );

            // Return success with token
            // In a more strict setup we would set an HttpOnly cookie here too
            return reply.send({
                message: 'Login realizado com sucesso',
                token,
                user: {
                    id: admin.id,
                    username: admin.username,
                    role: admin.role
                }
            });

        } catch (error) {
            console.error('Login Error:', error);
            return reply.status(500).send({ error: 'Erro interno no servidor.' });
        }
    });
}
