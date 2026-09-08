import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function run() {
  const dbPassword = process.argv[2] || process.env.SUPABASE_DB_PASSWORD;
  if (!dbPassword) {
    console.error('❌ Uso: node server/runSqlMigration.mjs <SENHA_DO_BANCO_POSTGRES>');
    process.exit(1);
  }

  const connectionString = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.cbeiguyvoepbcafmxduy.supabase.co:5432/postgres`;
  console.log('🔌 Conectando ao PostgreSQL do Supabase (db.cbeiguyvoepbcafmxduy.supabase.co:5432)...');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!');

    const sqlPath = path.resolve(__dirname, '..', 'supabase_setup.sql');
    console.log(`📄 Lendo script SQL: ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🚀 Executando criação de tabelas, índices, RLS e dados iniciais...');
    await client.query(sql);
    console.log('🎉 Todas as 16 tabelas, índices, políticas RLS e dados iniciais foram criados com SUCESSO!');
  } catch (err) {
    console.error('❌ Falha na execução do SQL:', err.message);
  } finally {
    await client.end();
  }
}

run();
