import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'participa_df',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export const initDB = async () => {
    try {
        // Cria conexão inicial sem especificar o banco de dados para verificar se ele existe
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || ''
        });

        await connection.query('CREATE DATABASE IF NOT EXISTS participa_df');
        await connection.end();

        // Agora verifica e cria as tabelas utilizando o pool de conexões
        const [rows] = await pool.query(`
            CREATE TABLE IF NOT EXISTS manifestations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                protocol VARCHAR(20) NOT NULL UNIQUE,
                text TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'manifestation',
                is_anonymous BOOLEAN DEFAULT TRUE,
                has_audio BOOLEAN DEFAULT FALSE,
                image_count INT DEFAULT 0,
                has_video BOOLEAN DEFAULT FALSE,
                status VARCHAR(50) DEFAULT 'received',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabela de Anexos
        await pool.query(`
            CREATE TABLE IF NOT EXISTS attachments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                manifestation_id INT NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_type VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (manifestation_id) REFERENCES manifestations(id) ON DELETE CASCADE
            );
        `);

        // Tabela de Respostas e Histórico
        await pool.query(`
            CREATE TABLE IF NOT EXISTS manifestation_responses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                manifestation_id INT NOT NULL,
                message TEXT NOT NULL,
                is_admin BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (manifestation_id) REFERENCES manifestations(id) ON DELETE CASCADE
            );
        `);

        console.log('Database and Tables verified.');

        // Migração segura para adicionar colunas de geolocalização e identificação
        const addColumnSafe = async (columnSQL: string) => {
            try {
                await pool.query(columnSQL);
                console.log(`Migration successful: ${columnSQL}`);
            } catch (e: any) {
                // Ignora erro "Duplicate column name" (Código 1060) caso a coluna já exista
                if (e.code === 'ER_DUP_FIELDNAME' || e.errno === 1060) {
                    return;
                }
                console.error(`Migration warning: ${e.message}`);
            }
        };

        await addColumnSafe("ALTER TABLE manifestations ADD COLUMN latitude DECIMAL(10, 8)");
        await addColumnSafe("ALTER TABLE manifestations ADD COLUMN longitude DECIMAL(11, 8)");
        await addColumnSafe("ALTER TABLE manifestations ADD COLUMN name VARCHAR(255) NULL");
        await addColumnSafe("ALTER TABLE manifestations ADD COLUMN cpf VARCHAR(20) NULL");

    } catch (error) {
        console.error('Error initializing database:', error);
    }

    try {
        // Tabela de Administradores
        await pool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Cria o Administrador Padrão se a tabela estiver vazia
        const [rows] = await pool.query('SELECT COUNT(*) as count FROM admins');
        // @ts-ignore
        if (rows[0].count === 0) {
            const bcrypt = await import('bcrypt');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
                ['admin', hashedPassword]
            );
            console.log('⚠️  Admin Padrão Criado: admin / admin123 (ALTERE ISSO EM PRODUÇÃO)');
        }
    } catch (error) {
        console.error('Error initializing admins table:', error);
    }
};

export default pool;
