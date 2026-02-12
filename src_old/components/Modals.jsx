import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { colors, buttonBase, inputBase } from '../utils/theme';
import { formatDate, formatDateTime, formatDateForInput, isOverdue, generateId, INDUSTRIES, SOURCES, parseDateInput } from '../utils/helpers';

const Modal = ({ children, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)' }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()}>{children}</div>
  </div>
);

const ModalBox = ({ children, maxWidth = 600 }) => (
  <div style={{ background: colors.bgLight, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 28, maxWidth, width: '90%', maxHeight: '85vh', overflowY: 'auto' }}>
    {children}
  </div>
);

export function HelpModal() {
  const { modals, closeModal } = useCRM();
  if (!modals.help) return null;
  
  const shortcuts = [
    ['Navigation', [['1', 'Dashboard'], ['3', 'Leads'], ['7', 'DNC'], ['9', 'Dead'], ['F', 'Follow-ups'], ['C', 'Calls'], ['G', 'Courses'], ['T', 'Trash'], ['A', 'Analytics']]],
    ['Actions', [['SPACE', 'Tally Call'], ['5/Enter', 'View/Edit'], ['←', 'Mark DNC'], ['→', 'Mark Dead'], ['Del', 'Delete'], ['+', 'Add Lead'], ['*', 'Email']]],
    ['Data', [['I', 'Import'], ['E', 'Export'], ['S', 'Settings'], ['/', 'Help'], ['Esc', 'Close']]]
  ];

  return (
    <Modal onClose={() => closeModal('help')}>
      <ModalBox maxWidth={800}>
        <h2 style={{ color: colors.primary, marginBottom: 20, fontSize: 20 }}>⌨️ Keyboard Shortcuts</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {shortcuts.map(([title, items]) => (
            <div key={title}>
              <h3 style={{ color: colors.warning, marginBottom: 12, fontSize: 13, textTransform: 'uppercase' }}>{title}</h3>
              {items.map(([key, desc]) => (
                <div key={key} style={{ fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>{key}</span>
                  <span style={{ marginLeft: 8, color: colors.textMuted }}>{desc}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </ModalBox>
    </Modal>
  );
}

export function SettingsModal() {
  const { modals, closeModal, settings, setSettings, golfCourses, clearAllData } = useCRM();
  if (!modals.settings) return null;

  return (
    <Modal onClose={() => closeModal('settings')}>
      <ModalBox maxWidth={420}>
        <h2 style={{ color: colors.text, marginBottom: 20, fontSize: 18 }}>⚙️ Settings</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: colors.textMuted, marginBottom: 6, fontSize: 12 }}>Daily Call Goal</label>
          <input type="number" value={settings.dailyGoal} onChange={e => setSettings(p => ({ ...p, dailyGoal: parseInt(e.target.value) || 200 }))} style={inputBase} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', color: colors.textMuted, marginBottom: 6, fontSize: 12 }}>Active Golf Course</label>
          <select value={settings.activeGolfCourse || ''} onChange={e => setSettings(p => ({ ...p, activeGolfCourse: e.target.value || null }))} style={inputBase}>
            <option value="">None</option>
            {golfCourses.map(gc => <option key={gc.id} value={gc.id}>{gc.name}</option>)}
          </select>
        </div>
        <button onClick={clearAllData} style={{ ...buttonBase, width: '100%', background: colors.danger, color: '#fff', marginBottom: 10 }}>🗑️ Clear All Data</button>
        <button onClick={() => closeModal('settings')} style={{ ...buttonBase, width: '100%', background: colors.bgCard, color: colors.text }}>Close</button>
      </ModalBox>
    </Modal>
  );
}

export function ImportModal() {
  const { modals, closeModal, setLeads, setDncList, setDeadLeads, setCallLog, setGolfCourses, settings, notify } = useCRM();
  const [data, setData] = useState('');
  if (!modals.import) return null;

  const doImport = () => {
    try {
      const json = JSON.parse(data);
      if (json.leads) setLeads(p => [...p, ...json.leads.map(l => ({ ...l, id: generateId() }))]);
      if (json.dncList) setDncList(p => [...p, ...json.dncList]);
      if (json.deadLeads) setDeadLeads(p => [...p, ...json.deadLeads]);
      if (json.callLog) setCallLog(p => [...p, ...json.callLog]);
      if (json.golfCourses) setGolfCourses(p => [...p, ...json.golfCourses.map(gc => ({ ...gc, id: generateId() }))]);
      notify('✅ Imported!'); closeModal('import'); setData('');
    } catch {
      const lines = data.trim().split('\n');
      if (lines.length < 2) { notify('❌ No data'); return; }
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
      const newLeads = lines.slice(1).map(line => {
        const vals = line.match(/(".*?"|[^,]+)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || [];
        const lead = { id: generateId(), createdAt: new Date().toISOString(), callCount: 0, callHistory: [], golfCourseId: settings.activeGolfCourse };
        headers.forEach((h, i) => {
          const v = vals[i] || '';
          if (h.includes('business') || h.includes('company')) lead.businessName = v;
          else if (h.includes('contact') || h === 'name') lead.contactName = v;
          else if (h.includes('phone')) lead.phone = v;
          else if (h.includes('email')) lead.email = v;
          else if (h.includes('note')) lead.notes = v;
        });
        return lead;
      }).filter(l => l.businessName || l.phone);
      if (newLeads.length) { setLeads(p => [...p, ...newLeads]); notify(`✅ Imported ${newLeads.length} leads!`); closeModal('import'); setData(''); }
      else notify('❌ No valid leads');
    }
  };

  return (
    <Modal onClose={() => closeModal('import')}>
      <ModalBox>
        <h2 style={{ color: colors.primary, marginBottom: 12, fontSize: 18 }}>📥 Import Data</h2>
        <p style={{ color: colors.textMuted, marginBottom: 16, fontSize: 13 }}>Paste CSV or JSON backup</p>
        <textarea value={data} onChange={e => setData(e.target.value)} placeholder="Paste data here..." style={{ ...inputBase, height: 180, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button onClick={doImport} style={{ ...buttonBase, flex: 1, background: colors.primary, color: '#fff' }}>Import</button>
          <button onClick={() => closeModal('import')} style={{ ...buttonBase, background: colors.bgCard, color: colors.text }}>Cancel</button>
        </div>
      </ModalBox>
    </Modal>
  );
}

export function ExportModal() {
  const { modals, closeModal, leads, dncList, deadLeads, callLog, golfCourses, emails, dailyStats, settings, notify } = useCRM();
  if (!modals.export) return null;

  const exportData = (type) => {
    const courseNameById = (id) => golfCourses.find(gc => gc.id === id)?.name || '';
    let data, filename, headers;
    
    if (type === 'all') {
      const blob = new Blob([JSON.stringify({ leads, dncList, deadLeads, emails, callLog, dailyStats, golfCourses, settings, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'crm_backup.json'; a.click();
      notify('📦 Backup exported!'); closeModal('export'); return;
    }
    
    const exports = {
      leads: { headers: ['Business Name', 'Contact', 'Phone', 'Email', 'Notes', 'Calls', 'Golf Course'], data: leads.map(l => [l.businessName, l.contactName, l.phone, l.email, l.notes, l.callCount || 0, courseNameById(l.golfCourseId)]), filename: 'leads.csv' },
      dnc: { headers: ['Business Name', 'Contact', 'Phone', 'DNC Date'], data: dncList.map(l => [l.businessName, l.contactName, l.phone, formatDateTime(l.dncDate)]), filename: 'dnc.csv' },
      dead: { headers: ['Business Name', 'Contact', 'Phone', 'Dead Date'], data: deadLeads.map(l => [l.businessName, l.contactName, l.phone, formatDateTime(l.deadDate)]), filename: 'dead.csv' },
      calls: { headers: ['Date', 'Lead', 'Phone', 'Outcome', 'Notes'], data: callLog.map(c => [formatDateTime(c.timestamp), c.leadName, c.phone, c.outcome, c.notes]), filename: 'calls.csv' },
      golfcourses: { headers: ['Name', 'Address', 'Phone', 'Contact', 'Email', 'Region'], data: golfCourses.map(gc => [gc.name, gc.address, gc.phone, gc.contactName, gc.email, gc.region]), filename: 'courses.csv' }
    };
    
    const exp = exports[type];
    const csv = [exp.headers, ...exp.data].map(row => row.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = exp.filename; a.click();
    notify(`📊 Exported!`); closeModal('export');
  };

  const options = [
    { key: 'leads', label: `Leads (${leads.length})`, color: colors.success },
    { key: 'dnc', label: `DNC (${dncList.length})`, color: colors.warning },
    { key: 'dead', label: `Dead (${deadLeads.length})`, color: colors.danger },
    { key: 'calls', label: `Calls (${callLog.length})`, color: colors.primary },
    { key: 'golfcourses', label: `Courses (${golfCourses.length})`, color: colors.accent },
    { key: 'all', label: 'Full Backup (JSON)', color: colors.text },
  ];

  return (
    <Modal onClose={() => closeModal('export')}>
      <ModalBox maxWidth={400}>
        <h2 style={{ color: colors.warning, marginBottom: 20, fontSize: 18 }}>📤 Export Data</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {options.map(o => (
            <button key={o.key} onClick={() => exportData(o.key)} style={{ ...buttonBase, background: colors.bgCard, color: o.color, border: `1px solid ${colors.border}`, textAlign: 'left' }}>{o.label}</button>
          ))}
        </div>
        <button onClick={() => closeModal('export')} style={{ ...buttonBase, width: '100%', marginTop: 16, background: colors.bg, color: colors.textMuted }}>Cancel</button>
      </ModalBox>
    </Modal>
  );
}

export function LeadDetailModal() {
  const { modals, closeModal, openModal, updateLead, moveToDNC, moveToDead, deleteToTrash, tallyCall, deleteCall } = useCRM();
  const lead = modals.leadDetail;
  if (!lead) return null;

  const setFollowUp = (days) => {
    const d = new Date(); d.setDate(d.getDate() + days);
    updateLead({ ...lead, followUp: d.toISOString().split('T')[0] });
  };

  return (
    <Modal onClose={() => closeModal('leadDetail')}>
      <ModalBox maxWidth={750}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ color: colors.text, fontSize: 22 }}>{lead.priority === 'hot' && '🔥 '}{lead.businessName}</h2>
            <p style={{ color: colors.textMuted }}>{lead.contactName}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => openModal('editLead', lead)} style={{ ...buttonBase, background: colors.bgCard, color: colors.primary }}>✏️ Edit</button>
            <button onClick={() => tallyCall(lead)} style={{ ...buttonBase, background: colors.success, color: '#fff' }}>📞 Call</button>
            <button onClick={() => closeModal('leadDetail')} style={{ ...buttonBase, background: colors.bgCard, color: colors.textMuted }}>✕</button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[['Phone', lead.phone], ['Email', lead.email], ['Website', lead.website], ['Industry', lead.industry]].map(([label, val]) => (
            <div key={label} style={{ background: colors.bgCard, padding: 14, borderRadius: 10 }}>
              <div style={{ color: colors.textDim, fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14 }}>{val || '—'}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <div style={{ background: colors.bgCard, padding: 16, borderRadius: 10, textAlign: 'center' }}>
            <div style={{ color: colors.success, fontSize: 28, fontWeight: '700' }}>{lead.callCount || 0}</div>
            <div style={{ color: colors.textDim, fontSize: 11 }}>Calls</div>
          </div>
          <div style={{ background: colors.bgCard, padding: 16, borderRadius: 10, textAlign: 'center' }}>
            <div style={{ color: colors.primary, fontSize: 28, fontWeight: '700' }}>{lead.emailCount || 0}</div>
            <div style={{ color: colors.textDim, fontSize: 11 }}>Emails</div>
          </div>
          <div style={{ background: colors.bgCard, padding: 16, borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: colors.textDim }}>Last Called</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>{formatDate(lead.lastCalled) || '—'}</div>
          </div>
          <div style={{ background: colors.bgCard, padding: 16, borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: isOverdue(lead.followUp) ? colors.danger : colors.textDim }}>Follow Up</div>
            <div style={{ fontSize: 13, marginTop: 4, color: isOverdue(lead.followUp) ? colors.danger : colors.text }}>{formatDate(lead.followUp) || '—'}</div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ color: colors.textDim, fontSize: 11, marginBottom: 8, textTransform: 'uppercase' }}>Set Follow-up</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[1, 2, 3, 5, 7, 14, 30].map(d => (
              <button key={d} onClick={() => setFollowUp(d)} style={{ ...buttonBase, padding: '8px 14px', background: colors.bgCard, color: colors.primary, fontSize: 12 }}>{d}d</button>
            ))}
            <button onClick={() => updateLead({ ...lead, followUp: '' })} style={{ ...buttonBase, padding: '8px 14px', background: colors.bgCard, color: colors.textMuted, fontSize: 12 }}>Clear</button>
          </div>
        </div>

        {lead.notes && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: colors.textDim, fontSize: 11, marginBottom: 8, textTransform: 'uppercase' }}>Notes</div>
            <div style={{ background: colors.bgCard, padding: 14, borderRadius: 10, fontSize: 13 }}>{lead.notes}</div>
          </div>
        )}

        {lead.callHistory?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: colors.textDim, fontSize: 11, marginBottom: 8, textTransform: 'uppercase' }}>Call History</div>
            <div style={{ maxHeight: 120, overflowY: 'auto' }}>
              {lead.callHistory.slice().reverse().map((c, i) => (
                <div key={i} style={{ padding: 10, background: colors.bgCard, borderRadius: 8, marginBottom: 6, fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.textMuted }}>{formatDateTime(c.timestamp)}</span>
                  <button onClick={() => deleteCall(c.id)} style={{ background: 'transparent', border: 'none', color: colors.danger, cursor: 'pointer', fontSize: 11 }}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
          <button onClick={() => { moveToDNC(lead); closeModal('leadDetail'); }} style={{ ...buttonBase, background: colors.warning, color: '#000' }}>🚫 DNC</button>
          <button onClick={() => { moveToDead(lead); closeModal('leadDetail'); }} style={{ ...buttonBase, background: colors.danger, color: '#fff' }}>💀 Dead</button>
          <button onClick={() => { updateLead({ ...lead, status: 'converted' }); }} style={{ ...buttonBase, background: colors.success, color: '#fff' }}>🎉 Convert</button>
          <button onClick={() => deleteToTrash(lead, 'lead')} style={{ ...buttonBase, background: colors.bgCard, color: colors.danger, marginLeft: 'auto' }}>🗑️ Delete</button>
        </div>
      </ModalBox>
    </Modal>
  );
}

export function EditLeadModal() {
  const { modals, closeModal, updateLead, golfCourses } = useCRM();
  const [form, setForm] = useState(null);
  
  React.useEffect(() => { if (modals.editLead) setForm({ ...modals.editLead }); }, [modals.editLead]);
  if (!form) return null;

  return (
    <Modal onClose={() => closeModal('editLead')}>
      <ModalBox maxWidth={700}>
        <h2 style={{ color: colors.text, marginBottom: 20, fontSize: 18 }}>✏️ Edit Lead</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Business Name</label>
            <input value={form.businessName || ''} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} style={inputBase} />
          </div>
          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Contact</label>
            <input value={form.contactName || ''} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} style={inputBase} />
          </div>
          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Phone</label>
            <input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputBase} />
          </div>
          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Email</label>
            <input value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputBase} />
          </div>
          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Website</label>
            <input value={form.website || ''} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} style={inputBase} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Address</label>
            <input value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} style={inputBase} />
          </div>
          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Industry</label>
            <select value={form.industry || 'Other'} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} style={inputBase}>
              {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Source</label>
            <select value={form.source || 'Other'} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} style={inputBase}>
              {SOURCES.map(src => <option key={src} value={src}>{src}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Call Date</label>
            <input type="date" value={formatDateForInput(form.callDate)} onChange={e => setForm(f => ({ ...f, callDate: parseDateInput(e.target.value) }))} style={inputBase} />
          </div>
          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Follow-up</label>
            <input type="date" value={formatDateForInput(form.followUp)} onChange={e => setForm(f => ({ ...f, followUp: parseDateInput(e.target.value) }))} style={inputBase} />
          </div>
          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Priority</label>
            <select value={form.priority || 'normal'} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={inputBase}>
              <option value="normal">Normal</option>
              <option value="hot">🔥 Hot</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Golf Course</label>
            <select value={form.golfCourseId || ''} onChange={e => setForm(f => ({ ...f, golfCourseId: e.target.value }))} style={inputBase}>
              <option value="">None</option>
              {golfCourses.map(gc => <option key={gc.id} value={gc.id}>{gc.name}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Notes</label>
            <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...inputBase, resize: 'vertical' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button onClick={() => updateLead(form)} style={{ ...buttonBase, flex: 1, background: colors.success, color: '#fff' }}>Save</button>
          <button onClick={() => closeModal('editLead')} style={{ ...buttonBase, background: colors.bgCard, color: colors.text }}>Cancel</button>
        </div>
      </ModalBox>
    </Modal>
  );
}

export function EditCallModal() {
  const { modals, closeModal, updateCall, deleteCall } = useCRM();
  const [form, setForm] = useState(null);
  
  React.useEffect(() => { if (modals.editCall) setForm({ ...modals.editCall }); }, [modals.editCall]);
  if (!form) return null;

  return (
    <Modal onClose={() => closeModal('editCall')}>
      <ModalBox maxWidth={500}>
        <h2 style={{ color: colors.text, marginBottom: 20, fontSize: 18 }}>✏️ Edit Call</h2>
        <div style={{ display: 'grid', gap: 14 }}>
          <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Lead Name</label><input value={form.leadName || ''} onChange={e => setForm(f => ({ ...f, leadName: e.target.value }))} style={inputBase} /></div>
          <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Phone</label><input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputBase} /></div>
          <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Date</label><input type="date" value={formatDateForInput(form.callDate || form.timestamp)} onChange={e => setForm(f => ({ ...f, callDate: parseDateInput(e.target.value) }))} style={inputBase} /></div>
          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Outcome</label>
            <select value={form.outcome || 'completed'} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} style={inputBase}>
              {['completed', 'voicemail', 'no-answer', 'callback', 'interested', 'not-interested'].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Notes</label><textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...inputBase, resize: 'vertical' }} /></div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button onClick={() => updateCall(form)} style={{ ...buttonBase, flex: 1, background: colors.success, color: '#fff' }}>Save</button>
          <button onClick={() => { deleteCall(form.id); closeModal('editCall'); }} style={{ ...buttonBase, background: colors.danger, color: '#fff' }}>Delete</button>
          <button onClick={() => closeModal('editCall')} style={{ ...buttonBase, background: colors.bgCard, color: colors.text }}>Cancel</button>
        </div>
      </ModalBox>
    </Modal>
  );
}

export function EditGolfCourseModal() {
  const { modals, closeModal, updateGolfCourse, deleteGolfCourse } = useCRM();
  const [form, setForm] = useState(null);
  
  React.useEffect(() => { if (modals.editGolfCourse) setForm({ ...modals.editGolfCourse }); }, [modals.editGolfCourse]);
  if (!form) return null;

  return (
    <Modal onClose={() => closeModal('editGolfCourse')}>
      <ModalBox maxWidth={550}>
        <h2 style={{ color: colors.accent, marginBottom: 20, fontSize: 18 }}>⛳ Edit Golf Course</h2>
        <div style={{ display: 'grid', gap: 14 }}>
          {[['name', 'Name'], ['address', 'Address'], ['phone', 'Phone'], ['contactName', 'Contact'], ['email', 'Email'], ['region', 'Region']].map(([key, label]) => (
            <div key={key}><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>{label}</label><input value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inputBase} /></div>
          ))}
          <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Notes</label><textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...inputBase, resize: 'vertical' }} /></div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button onClick={() => updateGolfCourse(form)} style={{ ...buttonBase, flex: 1, background: colors.success, color: '#fff' }}>Save</button>
          <button onClick={() => { deleteGolfCourse(form.id); closeModal('editGolfCourse'); }} style={{ ...buttonBase, background: colors.danger, color: '#fff' }}>Delete</button>
          <button onClick={() => closeModal('editGolfCourse')} style={{ ...buttonBase, background: colors.bgCard, color: colors.text }}>Cancel</button>
        </div>
      </ModalBox>
    </Modal>
  );
}

export function PrivacyModal() {
  const { modals, closeModal } = useCRM();
  if (!modals.privacy) return null;
  return (
    <Modal onClose={() => closeModal('privacy')}>
      <ModalBox>
        <h2 style={{ color: colors.text, marginBottom: 8, fontSize: 22 }}>Privacy Policy</h2>
        <p style={{ color: colors.textMuted, fontSize: 12, marginBottom: 20 }}>Last updated: February 2026</p>
        <div style={{ color: colors.textMuted, fontSize: 14, lineHeight: 1.6 }}>
          <p style={{ marginBottom: 16 }}>This application stores your CRM data locally in your browser using localStorage. Data never leaves your device.</p>
          <p style={{ marginBottom: 16 }}>We store: Lead info, call logs, golf course data, and settings. All locally.</p>
          <p>Contact: <a href="https://carloscrespo.info" target="_blank" rel="noopener noreferrer" style={{ color: colors.primary }}>carloscrespo.info</a></p>
        </div>
        <button onClick={() => closeModal('privacy')} style={{ ...buttonBase, width: '100%', marginTop: 20, background: colors.bgCard, color: colors.text }}>Close</button>
      </ModalBox>
    </Modal>
  );
}

export function TermsModal() {
  const { modals, closeModal } = useCRM();
  if (!modals.terms) return null;
  return (
    <Modal onClose={() => closeModal('terms')}>
      <ModalBox>
        <h2 style={{ color: colors.text, marginBottom: 8, fontSize: 22 }}>Terms of Use</h2>
        <p style={{ color: colors.textMuted, fontSize: 12, marginBottom: 20 }}>Last updated: February 2026</p>
        <div style={{ color: colors.textMuted, fontSize: 14, lineHeight: 1.6 }}>
          <p style={{ marginBottom: 12 }}><strong style={{ color: colors.text }}>1. Overview</strong> - Client-side CRM. Data stored locally. No financial advice.</p>
          <p style={{ marginBottom: 12 }}><strong style={{ color: colors.text }}>2. No Warranties</strong> - Provided "as is". Verify your data.</p>
          <p style={{ marginBottom: 12 }}><strong style={{ color: colors.text }}>3. Liability</strong> - Not liable for data loss. Use backups.</p>
          <p><strong style={{ color: colors.text }}>4. Changes</strong> - May update terms. Continued use = acceptance.</p>
        </div>
        <button onClick={() => closeModal('terms')} style={{ ...buttonBase, width: '100%', marginTop: 20, background: colors.bgCard, color: colors.text }}>Close</button>
      </ModalBox>
    </Modal>
  );
}

export function AllModals() {
  return (
    <>
      <HelpModal />
      <SettingsModal />
      <ImportModal />
      <ExportModal />
      <LeadDetailModal />
      <EditLeadModal />
      <EditCallModal />
      <EditGolfCourseModal />
      <PrivacyModal />
      <TermsModal />
    </>
  );
}