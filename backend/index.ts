import Fastify from 'fastify';
import cors from '@fastify/cors';
import { manifestRoutes } from './routes/manifestations';

const server = Fastify({ logger: true });

server.register(require('@fastify/multipart'), {
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    }
});

server.register(require('@fastify/helmet'));
server.register(require('@fastify/cookie'));

server.register(cors, {
    origin: '*',
});

import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';

server.register(manifestRoutes, { prefix: '/api/v1' });
server.register(authRoutes, { prefix: '/api/v1/auth' });
server.register(adminRoutes, { prefix: '/api/v1/admin' });

import { initDB } from './db';

const start = async () => {
    try {
        await initDB();
        await server.listen({ port: 3000, host: '0.0.0.0' });
        console.log('Server running on http://localhost:3000');
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
