import fs from 'fs';
import path from 'path';

const LIVE_URL = 'https://talvanebarber.discloud.app';
const DB_PATH = path.resolve('server', 'flows_db.json');

async function mergeLive() {
  console.log('[MergeLive] 🔄 Sincronizando dados vivos da Discloud com flows_db.json local...');
  let localDb = {
    flows: [],
    nodes: {},
    edges: {},
    botProfile: {},
    sessions: {},
    appointments: [],
    contacts: {},
    conversations: {},
    messages: {},
    agendaSettings: {},
  };

  if (fs.existsSync(DB_PATH)) {
    try {
      localDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } catch (e) {}
  }

  try {
    // 1. Fetch Flows
    const flowsRes = await fetch(`${LIVE_URL}/api/whatsapp/flows`, { signal: AbortSignal.timeout(6000) });
    if (flowsRes.ok) {
      const liveFlows = await flowsRes.json();
      if (Array.isArray(liveFlows) && liveFlows.length > 0) {
        const flowMap = new Map();
        (localDb.flows || []).forEach(f => flowMap.set(f.id, f));
        liveFlows.forEach(f => {
          const existing = flowMap.get(f.id);
          if (!existing || new Date(f.updated_at || 0) >= new Date(existing.updated_at || 0)) {
            flowMap.set(f.id, f);
          }
        });
        localDb.flows = Array.from(flowMap.values());
        console.log(`[MergeLive] ✅ ${localDb.flows.length} fluxos sincronizados.`);

        // Fetch graphs for each live flow
        if (!localDb.nodes) localDb.nodes = {};
        if (!localDb.edges) localDb.edges = {};

        for (const f of localDb.flows) {
          try {
            const gRes = await fetch(`${LIVE_URL}/api/whatsapp/flows/${f.id}/graph`, { signal: AbortSignal.timeout(4000) });
            if (gRes.ok) {
              const gData = await gRes.json();
              if (gData.nodes && gData.nodes.length > 0) localDb.nodes[f.id] = gData.nodes;
              if (gData.edges && gData.edges.length > 0) localDb.edges[f.id] = gData.edges;
            }
          } catch {}
        }
      }
    }

    // 2. Fetch Agenda Settings
    const setRes = await fetch(`${LIVE_URL}/api/whatsapp/agenda/settings`, { signal: AbortSignal.timeout(4000) });
    if (setRes.ok) {
      const liveSet = await setRes.json();
      if (liveSet && typeof liveSet === 'object' && Object.keys(liveSet).length > 0) {
        localDb.agendaSettings = { ...(localDb.agendaSettings || {}), ...liveSet };
        console.log('[MergeLive] ✅ Configurações de Agenda sincronizadas.');
      }
    }

    // 3. Fetch Appointments
    const aptRes = await fetch(`${LIVE_URL}/api/whatsapp/agenda/appointments`, { signal: AbortSignal.timeout(4000) });
    if (aptRes.ok) {
      const liveApts = await aptRes.json();
      if (Array.isArray(liveApts) && liveApts.length > 0) {
        const aptMap = new Map();
        (localDb.appointments || []).forEach(a => aptMap.set(a.id, a));
        liveApts.forEach(a => aptMap.set(a.id, a));
        localDb.appointments = Array.from(aptMap.values());
        console.log(`[MergeLive] ✅ ${localDb.appointments.length} agendamentos sincronizados.`);
      }
    }

    // 4. Fetch Attendants
    try {
      const attRes = await fetch(`${LIVE_URL}/api/whatsapp/attendants`, { signal: AbortSignal.timeout(4000) });
      if (attRes.ok) {
        const liveAtts = await attRes.json();
        if (Array.isArray(liveAtts) && liveAtts.length > 0) {
          const attMap = new Map();
          (localDb.attendants || []).forEach(a => attMap.set(a.id, a));
          liveAtts.forEach(a => attMap.set(a.id, a));
          localDb.attendants = Array.from(attMap.values());
          console.log(`[MergeLive] ✅ ${localDb.attendants.length} atendentes sincronizados.`);
        }
      }
    } catch {}

    // Save merged DB
    fs.writeFileSync(DB_PATH, JSON.stringify(localDb, null, 2), 'utf-8');
    console.log('[MergeLive] 🎉 Sincronização concluída com sucesso!');
  } catch (err) {
    console.warn('[MergeLive] ⚠️ Não foi possível sincronizar com o bot online (talvez offline):', err.message);
  }
}

mergeLive();
