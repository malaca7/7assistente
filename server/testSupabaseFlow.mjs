import './websocketPolyfill.mjs';
import WebSocket from 'ws';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nskflvulclgwqqasdntq.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5za2ZsdnVsY2xnd3FxYXNkbnRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMTQ0NjQsImV4cCI6MjEwMzU5MDQ2NH0.mL82cgH4MadNi_sTeKKgYmRAuhmp7HqImuAs9hTrTZI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket }
});

async function run() {
  console.log('=== FLOWS IN SUPABASE ===');
  const { data: flows, error: fErr } = await supabase.from('flows').select('*');
  console.log('Flows:', flows, fErr);

  console.log('\n=== FLOW NODES IN SUPABASE ===');
  const { data: nodes, error: nErr } = await supabase.from('flow_nodes').select('*');
  console.log('Total nodes:', nodes?.length, nErr);
  if (nodes) {
    nodes.forEach(n => console.log(` - Node ${n.id} [${n.flow_id}] (${n.node_type || n.type}):`, JSON.stringify(n.data || {}).substring(0, 100)));
  }

  console.log('\n=== FLOW EDGES IN SUPABASE ===');
  const { data: edges, error: eErr } = await supabase.from('flow_edges').select('*');
  console.log('Total edges:', edges?.length, eErr);
  if (edges) {
    edges.forEach(e => console.log(` - Edge ${e.id} [${e.flow_id}]: ${e.source_node_id || e.source} -> ${e.target_node_id || e.target}`));
  }

  console.log('\n=== SETTINGS IN SUPABASE ===');
  const { data: settings } = await supabase.from('settings').select('*');
  console.log('Settings:', JSON.stringify(settings, null, 2));

  process.exit(0);
}

run();
