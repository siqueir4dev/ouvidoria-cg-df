import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';
import rateLimit from '@fastify/rate-limit';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_dev_only';
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;

const loginSchema = {
    body: {
        type: 'object',
        required: ['username', 'password', 'recaptchaToken'],
        properties: {
            username: { type: 'string' },
            password: { type: 'string' },
            recaptchaToken: { type: 'string' }
        }
    }
};

export default async function authRoutes(fastify: FastifyInstance) {

    // Rate Limiting for Login: Max 5 attempts per 1 minute
    await fastify.register(rateLimit, {
        max: 5,
        timeWindow: '1 minute',
        errorResponseBuilder: () => ({ error: 'Muitas tentativas de login. Tente novamente em 1 minuto.' })
    });

    fastify.post('/login', { schema: loginSchema }, async (request, reply) => {
        // @ts-ignore
        const { username, password, recaptchaToken } = request.body;

        // Verify reCAPTCHA
        try {
            const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${recaptchaToken}`;
            const captchaRes = await fetch(verifyUrl, { method: 'POST' });
            const captchaData = await captchaRes.json();

            if (!captchaData.success) {
                return reply.status(400).send({ error: 'Falha na verificação do reCAPTCHA' });
            }
        } catch (e) {
            console.error('reCAPTCHA Error:', e);
            // In dev we might want to bypass or warn, but for secure Prod we fail
            return reply.status(500).send({ error: 'Erro ao verificar reCAPTCHA' });
        }

        try {
            const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
            // @ts-ignore
            const admin = rows[0];

            if (!admin) {
                // Dummy hash comparison to prevent timing attacks
                await bcrypt.compare('dummy', '$2b$10$dummyhashdummyhashdummyhashdummyhashdummyhash');
                return reply.status(401).send({ error: 'Credenciais inválidas.' });
            }

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
            request.log.error(error);
            return reply.status(500).send({ error: 'Erro interno no servidor.' });
        }
    });
}
