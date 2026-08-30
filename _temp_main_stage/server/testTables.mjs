import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nskflvulclgwqqasdntq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5za2ZsdnVsY2xnd3FxYXNkbnRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMTQ0NjQsImV4cCI6MjEwMzU5MDQ2NH0.mL82cgH4MadNi_sTeKKgYmRAuhmp7HqImuAs9hTrTZI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const candidateTables = [
  'admin_profiles',
  'flows',
  'flow_nodes',
  'flow_edges',
  'contacts',
  'conversations',
  'messages',
  'settings',
  'whatsapp_sessions',
  'sessions',
  'config',
  'app_settings',
  'profiles'
];

async function checkTables() {
  for (const table of candidateTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      console.log(`✅ Table exists: ${table} (rows: ${data?.length})`);
    } else {
      console.log(`❌ Table missing: ${table} (${error.message})`);
    }
  }
}

checkTables().catch(console.error);
