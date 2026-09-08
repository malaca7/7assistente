import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cbeiguyvoepbcafmxduy.supabase.co';
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZWlndXl2b2VwYmNhZm14ZHV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODczNTk3NywiZXhwIjoyMTA0MzExOTc3fQ.sbB-6Fx4uR61oDin8djrdbpmNSPs2Z8hGdYSoVhIHvw';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZWlndXl2b2VwYmNhZm14ZHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MzU5NzcsImV4cCI6MjEwNDMxMTk3N30.1XpWL6ns9NlPh4sQ3M8-OJTnKCPH-jf89iFspmBrKxM';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

async function test() {
  console.log('Testing Supabase connection with service_role...');
  
  // Test listing tables or checking a table
  const testTables = ['stores', 'products', 'categories', 'clients', 'conversations', 'chat_messages', 'flows', 'flow_nodes', 'flow_edges', 'system_users', 'bot_config', 'settings'];
  
  for (const tbl of testTables) {
    const { data, error } = await supabaseAdmin.from(tbl).select('*').limit(1);
    if (error) {
      console.log(`Table '${tbl}': ❌ ERROR (${error.code}) - ${error.message}`);
    } else {
      console.log(`Table '${tbl}': ✅ EXISTS (${data?.length || 0} rows)`);
    }
  }

  // Check if we can execute SQL via /rest/v1/rpc or pg meta or sql endpoint
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE,
        'Authorization': `Bearer ${SERVICE_ROLE}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: 'SELECT 1;' })
    });
    console.log('rpc/exec_sql response status:', res.status);
  } catch (e) {
    console.log('rpc/exec_sql fetch failed:', e.message);
  }

  try {
    const res2 = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE,
        'Authorization': `Bearer ${SERVICE_ROLE}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: 'SELECT 1;' })
    });
    console.log('/pg/query response status:', res2.status);
  } catch (e) {
    console.log('/pg/query fetch failed:', e.message);
  }

  try {
    const res3 = await fetch(`https://api.supabase.com/v1/projects/cbeiguyvoepbcafmxduy/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: 'SELECT 1;' })
    });
    console.log('api.supabase.com query response status:', res3.status);
  } catch (e) {
    console.log('api.supabase.com query failed:', e.message);
  }
}

test();
