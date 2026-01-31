import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_dev_only';

export interface AuthRequest extends FastifyRequest {
    user?: {
        id: number;
        username: string;
        role: string;
    }
}

export const authenticateToken = async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip auth for Preflight/OPTIONS requests
    if (request.method === 'OPTIONS') return;

    try {
        const authHeader = request.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return reply.status(401).send({ error: 'Acesso Negado. Token não fornecido.' });
        }

        const user = jwt.verify(token, JWT_SECRET) as any;
        (request as AuthRequest).user = user;
    } catch (err) {
        return reply.status(403).send({ error: 'Token Inválido ou Expirado.' });
    }
};
