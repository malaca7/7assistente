import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nskflvulclgwqqasdntq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5za2ZsdnVsY2xnd3FxYXNkbnRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMTQ0NjQsImV4cCI6MjEwMzU5MDQ2NH0.mL82cgH4MadNi_sTeKKgYmRAuhmp7HqImuAs9hTrTZI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  console.log('Testing select on settings...');
  const { data, error } = await supabase.from('settings').select('*');
  console.log('Select result:', { data, error });

  console.log('Testing upsert on settings...');
  const testPayload = {
    id: data?.[0]?.id || 'default',
    whatsapp_session: {
      status: 'qrcode',
      qr: 'test_qr_1234567890',
      qrDataUrl: 'data:image/png;base64,test',
      updated_at: new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
  };

  const upsertRes = await supabase.from('settings').upsert(testPayload);
  console.log('Upsert result:', upsertRes);
}

test().catch(console.error);
