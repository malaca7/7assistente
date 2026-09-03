import fs from 'fs';
import path from 'path';

const LIVE_URL = process.env.BACKEND_URL || 'https://talvane.discloud.app';
const DB_PATH = path.resolve('server', 'flows_db.json');

async function mergeLive() {
  console.log('[MergeLive] 🔄 Sincronizando dados vivos da Discloud com flows_db.json local...');
  let localDb = {
    flows: [],
    nodes: {},
    edges: {},
    botProfile: {},
    settings: {},
    sessions: {},
    appointments: [],
    contacts: {},
    conversations: {},
    attendants: [],
    agendaSettings: {},
    systemUsers: [],
  };

  if (fs.existsSync(DB_PATH)) {
    try {
      localDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } catch (e) {}
  }

  try {
    // 1. Fetch Live Settings & Bot Profile (Identidade do Robô, Empresa, Mensagens)
    try {
      const settingsRes = await fetch(`${LIVE_URL}/api/whatsapp/settings`, { signal: AbortSignal.timeout(5000) });
      if (settingsRes.ok) {
        const liveData = await settingsRes.json();
        if (liveData.botProfile && Object.keys(liveData.botProfile).length > 0) {
          localDb.botProfile = { ...(localDb.botProfile || {}), ...liveData.botProfile };
          console.log(`[MergeLive] ✅ Perfil do Robô sincronizado (${localDb.botProfile.name || 'Assistente'}).`);
        }
        if (liveData.settings && Object.keys(liveData.settings).length > 0) {
          localDb.settings = { ...(localDb.settings || {}), ...liveData.settings };
          console.log('[MergeLive] ✅ Configurações gerais sincronizadas.');
        }
        if (liveData.agendaSettings && Object.keys(liveData.agendaSettings).length > 0) {
          localDb.agendaSettings = { ...(localDb.agendaSettings || {}), ...liveData.agendaSettings };
        }
      }
    } catch (e) {
      console.warn('[MergeLive] ⚠️ Aviso ao sincronizar settings:', e.message);
    }

    // 2. Fetch Flows
    try {
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
    } catch (e) {}

    // 3. Fetch Agenda Settings
    try {
      const setRes = await fetch(`${LIVE_URL}/api/whatsapp/agenda/settings`, { signal: AbortSignal.timeout(4000) });
      if (setRes.ok) {
        const liveSet = await setRes.json();
        if (liveSet && typeof liveSet === 'object' && Object.keys(liveSet).length > 0) {
          localDb.agendaSettings = { ...(localDb.agendaSettings || {}), ...liveSet };
          console.log('[MergeLive] ✅ Configurações de Agenda sincronizadas.');
        }
      }
    } catch {}

    // 4. Fetch Appointments
    try {
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
    } catch {}

    // 5. Fetch Contacts
    try {
      const contactsRes = await fetch(`${LIVE_URL}/api/whatsapp/contacts`, { signal: AbortSignal.timeout(5000) });
      if (contactsRes.ok) {
        const liveContacts = await contactsRes.json();
        if (Array.isArray(liveContacts) && liveContacts.length > 0) {
          if (!localDb.contacts) localDb.contacts = {};
          liveContacts.forEach(c => {
            const cleanPhone = (c.phone || c.id || '').replace(/\D/g, '');
            if (cleanPhone) {
              localDb.contacts[cleanPhone] = {
                ...(localDb.contacts[cleanPhone] || {}),
                ...c,
              };
            }
          });
          console.log(`[MergeLive] ✅ ${liveContacts.length} contatos vivos sincronizados.`);
        }
      }
    } catch {}

    // 6. Fetch Attendants
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

    // 7. Fetch System Users
    try {
      const usersRes = await fetch(`${LIVE_URL}/api/whatsapp/users`, { signal: AbortSignal.timeout(4000) });
      if (usersRes.ok) {
        const liveUsers = await usersRes.json();
        if (Array.isArray(liveUsers) && liveUsers.length > 0) {
          const userMap = new Map();
          (localDb.systemUsers || []).forEach(u => userMap.set(u.id, u));
          liveUsers.forEach(u => userMap.set(u.id, u));
          localDb.systemUsers = Array.from(userMap.values());
          console.log(`[MergeLive] ✅ ${localDb.systemUsers.length} usuários sincronizados.`);
        }
      }
    } catch {}

    // Save merged DB to flows_db.json
    fs.writeFileSync(DB_PATH, JSON.stringify(localDb, null, 2), 'utf-8');
    console.log('[MergeLive] 🎉 Sincronização completa de banco de dados concluída!');
  } catch (err) {
    console.warn('[MergeLive] ⚠️ Não foi possível sincronizar com o bot online (talvez offline):', err.message);
  }
}

mergeLive();
