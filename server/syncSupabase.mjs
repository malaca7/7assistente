// Script utilitário para sincronizar dados do banco persistente com o Supabase
import { loadDb } from './flowRunner.mjs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cbeiguyvoepbcafmxduy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Supabase não configurado no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sync() {
  console.log('🔄 [Supabase Sync] Iniciando sincronização do banco local para o Supabase...');
  const db = loadDb();

  // 1. Sincronizar Lojas
  if (Array.isArray(db.stores) && db.stores.length > 0) {
    console.log(`📡 Sincronizando ${db.stores.length} lojas...`);
    for (const s of db.stores) {
      const { error } = await supabase.from('stores').upsert(s, { onConflict: 'id' });
      if (error) console.warn(`   Aviso loja ${s.name}: ${error.message}`);
    }
  }

  // 2. Sincronizar Categorias
  if (Array.isArray(db.categories) && db.categories.length > 0) {
    console.log(`📡 Sincronizando ${db.categories.length} categorias...`);
    for (const c of db.categories) {
      const { error } = await supabase.from('categories').upsert(c, { onConflict: 'id' });
      if (error) console.warn(`   Aviso categoria ${c.name}: ${error.message}`);
    }
  }

  // 3. Sincronizar Produtos
  if (Array.isArray(db.products) && db.products.length > 0) {
    console.log(`📡 Sincronizando ${db.products.length} produtos...`);
    for (const p of db.products) {
      const { error } = await supabase.from('products').upsert(p, { onConflict: 'id' });
      if (error) console.warn(`   Aviso produto ${p.name}: ${error.message}`);
    }
  }

  // 4. Sincronizar Clientes / Contatos
  if (db.contacts) {
    const contactsList = Object.values(db.contacts);
    console.log(`📡 Sincronizando ${contactsList.length} contatos...`);
    for (const c of contactsList) {
      const { error } = await supabase.from('clients').upsert(c, { onConflict: 'phone' });
      if (error) console.warn(`   Aviso contato ${c.phone}: ${error.message}`);
    }
  }

  // 5. Sincronizar Fluxos
  if (Array.isArray(db.flows) && db.flows.length > 0) {
    console.log(`📡 Sincronizando ${db.flows.length} fluxos...`);
    for (const f of db.flows) {
      const { error } = await supabase.from('flows').upsert(f, { onConflict: 'id' });
      if (error) console.warn(`   Aviso fluxo ${f.name}: ${error.message}`);
    }
  }

  console.log('✅ [Supabase Sync] Processo de sincronização finalizado.');
}

sync().catch(err => {
  console.error('❌ Erro na sincronização:', err);
});
