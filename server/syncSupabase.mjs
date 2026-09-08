// Script utilitário para sincronizar dados do banco persistente com o Supabase
import { loadDb } from './flowRunner.mjs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cbeiguyvoepbcafmxduy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZWlndXl2b2VwYmNhZm14ZHV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODczNTk3NywiZXhwIjoyMTA0MzExOTc3fQ.sbB-6Fx4uR61oDin8djrdbpmNSPs2Z8hGdYSoVhIHvw';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Supabase não configurado no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function syncToSupabase(dbOverride) {
  console.log('🔄 [Supabase Sync] Iniciando sincronização completa para o Supabase...');
  const db = dbOverride || loadDb();
  const report = {
    stores: 0,
    categories: 0,
    products: 0,
    clients: 0,
    flows: 0,
    nodes: 0,
    edges: 0,
    tickets: 0,
    appointments: 0,
    users: 0,
    botConfig: 0,
    settings: 0,
    errors: [],
  };

  // 1. Sincronizar Lojas
  if (Array.isArray(db.stores) && db.stores.length > 0) {
    console.log(`📡 Sincronizando ${db.stores.length} lojas...`);
    for (const s of db.stores) {
      try {
        const { error } = await supabase.from('stores').upsert(s, { onConflict: 'id' });
        if (error) report.errors.push(`stores: ${error.message}`);
        else report.stores++;
      } catch (err) {
        report.errors.push(`stores: ${err.message}`);
      }
    }
  }

  // 2. Sincronizar Categorias
  if (Array.isArray(db.categories) && db.categories.length > 0) {
    console.log(`📡 Sincronizando ${db.categories.length} categorias...`);
    for (const c of db.categories) {
      try {
        const { error } = await supabase.from('categories').upsert(c, { onConflict: 'id' });
        if (error) report.errors.push(`categories: ${error.message}`);
        else report.categories++;
      } catch (err) {
        report.errors.push(`categories: ${err.message}`);
      }
    }
  }

  // 3. Sincronizar Produtos
  if (Array.isArray(db.products) && db.products.length > 0) {
    console.log(`📡 Sincronizando ${db.products.length} produtos...`);
    for (const p of db.products) {
      try {
        const { error } = await supabase.from('products').upsert(p, { onConflict: 'id' });
        if (error) report.errors.push(`products: ${error.message}`);
        else report.products++;
      } catch (err) {
        report.errors.push(`products: ${err.message}`);
      }
    }
  }

  // 4. Sincronizar Clientes / Contatos
  if (db.contacts) {
    const contactsList = Object.values(db.contacts);
    console.log(`📡 Sincronizando ${contactsList.length} contatos...`);
    for (const c of contactsList) {
      try {
        const { error } = await supabase.from('clients').upsert(c, { onConflict: 'phone' });
        if (error) report.errors.push(`clients: ${error.message}`);
        else report.clients++;
      } catch (err) {
        report.errors.push(`clients: ${err.message}`);
      }
    }
  }

  // 5. Sincronizar Fluxos
  if (Array.isArray(db.flows) && db.flows.length > 0) {
    console.log(`📡 Sincronizando ${db.flows.length} fluxos...`);
    for (const f of db.flows) {
      try {
        const { error } = await supabase.from('flows').upsert(f, { onConflict: 'id' });
        if (error) report.errors.push(`flows: ${error.message}`);
        else report.flows++;
      } catch (err) {
        report.errors.push(`flows: ${err.message}`);
      }
    }
  }

  // 6. Sincronizar Nós e Arestas dos Fluxos
  if (db.nodes && typeof db.nodes === 'object') {
    for (const [flowId, nodesList] of Object.entries(db.nodes)) {
      if (Array.isArray(nodesList)) {
        for (const n of nodesList) {
          try {
            const { error } = await supabase.from('flow_nodes').upsert({
              id: n.id,
              flow_id: flowId,
              type: n.type || 'text_message',
              label: n.data?.label || n.label || 'Nó',
              data: n.data || {},
              position: n.position || { x: 0, y: 0 },
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
            if (error) report.errors.push(`nodes: ${error.message}`);
            else report.nodes++;
          } catch (err) {
            report.errors.push(`nodes: ${err.message}`);
          }
        }
      }
    }
  }

  if (db.edges && typeof db.edges === 'object') {
    for (const [flowId, edgesList] of Object.entries(db.edges)) {
      if (Array.isArray(edgesList)) {
        for (const e of edgesList) {
          try {
            const { error } = await supabase.from('flow_edges').upsert({
              id: e.id,
              flow_id: flowId,
              source: e.source,
              target: e.target,
              source_handle: e.sourceHandle || null,
              target_handle: e.targetHandle || null,
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
            if (error) report.errors.push(`edges: ${error.message}`);
            else report.edges++;
          } catch (err) {
            report.errors.push(`edges: ${err.message}`);
          }
        }
      }
    }
  }

  // 7. Sincronizar Tickets de Suporte
  if (Array.isArray(db.tickets) && db.tickets.length > 0) {
    for (const t of db.tickets) {
      try {
        const { error } = await supabase.from('support_tickets').upsert(t, { onConflict: 'id' });
        if (error) report.errors.push(`tickets: ${error.message}`);
        else report.tickets++;
      } catch (err) {
        report.errors.push(`tickets: ${err.message}`);
      }
    }
  }

  // 8. Sincronizar Consultorias & Agendamentos
  if (Array.isArray(db.appointments) && db.appointments.length > 0) {
    for (const a of db.appointments) {
      try {
        const { error } = await supabase.from('appointments').upsert(a, { onConflict: 'id' });
        if (error) report.errors.push(`appointments: ${error.message}`);
        else report.appointments++;
      } catch (err) {
        report.errors.push(`appointments: ${err.message}`);
      }
    }
  }

  // 9. Sincronizar Usuários e Acessos
  if (Array.isArray(db.systemUsers) && db.systemUsers.length > 0) {
    for (const u of db.systemUsers) {
      try {
        const { error } = await supabase.from('system_users').upsert(u, { onConflict: 'id' });
        if (error) report.errors.push(`system_users: ${error.message}`);
        else report.users++;
      } catch (err) {
        report.errors.push(`system_users: ${err.message}`);
      }
    }
  }

  // 10. Sincronizar Configurações do Robô
  if (db.botProfile) {
    try {
      const { error } = await supabase.from('bot_config').upsert({
        id: 'default',
        ...db.botProfile,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      if (error) report.errors.push(`bot_config: ${error.message}`);
      else report.botConfig++;
    } catch (err) {
      report.errors.push(`bot_config: ${err.message}`);
    }
  }

  // 11. Sincronizar Settings Gerais
  if (db.settings) {
    try {
      const { error } = await supabase.from('settings').upsert({
        id: 'global',
        ...db.settings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      if (error) report.errors.push(`settings: ${error.message}`);
      else report.settings++;
    } catch (err) {
      report.errors.push(`settings: ${err.message}`);
    }
  }

  console.log('✅ [Supabase Sync] Processo de sincronização finalizado:', report);
  return report;
}

if (process.argv[1]?.includes('syncSupabase.mjs')) {
  syncToSupabase().catch(err => {
    console.error('❌ Erro na sincronização:', err);
  });
}
