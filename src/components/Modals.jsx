import React, { useState, useRef } from 'react';
import { useCRM } from '../context/CRMContext';
import { colors, buttonBase, inputBase } from '../utils/theme.jsx';
import { formatDate, formatDateTime, formatDateForInput, formatDateDisplay, isOverdue, generateId, INDUSTRIES, SOURCES, parseDateInput, SALE_TYPES } from '../utils/helpers';
import { IconX } from './Icons';

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

const DateInput = ({ value, onChange, label }) => {
  const inputRef = useRef(null);
  const displayValue = value ? formatDateDisplay(value) : '';
  return (
    <div>
      <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>{label}</label>
      <div onClick={() => inputRef.current?.showPicker?.() || inputRef.current?.focus()} style={{ ...inputBase, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: displayValue ? colors.text : colors.textDim }}>{displayValue || 'Click to select'}</span>
        <span style={{ color: colors.textDim }}></span>
        <input ref={inputRef} type="date" value={formatDateForInput(value)} onChange={e => onChange(parseDateInput(e.target.value))} style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }} />
      </div>
    </div>
  );
};

export function HelpModal() {
  const { modals, closeModal } = useCRM();
  if (!modals.help) return null;
  const shortcuts = [
    ['Navigation', [['1', 'Dashboard'], ['3', 'Leads'], ['7', 'DNC'], ['9', 'Dead'], ['V', 'Converted'], ['F', 'Follow-ups'], ['C', 'Calls'], ['$', 'Sales']]],
    ['More Nav', [['G', 'Courses'], ['T', 'Trash'], ['A', 'Analytics'], ['-', 'Emails']]],
    ['Actions', [['SPACE', 'Tally Call'], ['E', 'Quick Email'], ['Enter', 'View/Edit'], ['←', 'DNC'], ['→', 'Dead'], ['.', 'Delete'], ['+', 'Add Lead']]],
    ['Data', [['I', 'Import'], ['X', 'Export'], ['S', 'Settings'], ['/', 'Help'], ['Esc', 'Close']]]
  ];
  return (
    <Modal onClose={() => closeModal('help')}>
      <ModalBox maxWidth={800}>
        <h2 style={{ color: colors.primary, marginBottom: 20, fontSize: 20 }}>️ Keyboard Shortcuts</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {shortcuts.map(([title, items]) => (
            <div key={title}>
              <h3 style={{ color: colors.warning, marginBottom: 12, fontSize: 12, textTransform: 'uppercase' }}>{title}</h3>
              {items.map(([key, desc]) => (
                <div key={key} style={{ fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 5px', borderRadius: 4 }}>{key}</span>
                  <span style={{ marginLeft: 6, color: colors.textMuted }}>{desc}</span>
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
        <h2 style={{ color: colors.text, marginBottom: 20, fontSize: 18 }}>️ Settings</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: colors.textMuted, marginBottom: 6, fontSize: 12 }}>Daily Call Goal</label>
          <input type="number" value={settings.dailyGoal} onChange={e => setSettings(p => ({ ...p, dailyGoal: parseInt(e.target.value) || 150 }))} style={inputBase} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: colors.textMuted, marginBottom: 6, fontSize: 12 }}>Daily Sales Goal</label>
          <input type="number" value={settings.dailySalesGoal || 2} onChange={e => setSettings(p => ({ ...p, dailySalesGoal: parseInt(e.target.value) || 2 }))} style={inputBase} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', color: colors.textMuted, marginBottom: 6, fontSize: 12 }}>Active Golf Course</label>
          <select value={settings.activeGolfCourse || ''} onChange={e => setSettings(p => ({ ...p, activeGolfCourse: e.target.value || null }))} style={inputBase}>
            <option value="">None</option>
            {golfCourses.map(gc => <option key={gc.id} value={gc.id}>{gc.name}</option>)}
          </select>
        </div>
        <button onClick={clearAllData} style={{ ...buttonBase, width: '100%', background: colors.danger, color: '#fff', marginBottom: 10 }}>️ Clear All Data</button>
        <button onClick={() => closeModal('settings')} style={{ ...buttonBase, width: '100%', background: colors.bgCard, color: colors.text }}>Close</button>
      </ModalBox>
    </Modal>
  );
}

export function ImportModal() {
  const { modals, closeModal, setLeads, settings, notify } = useCRM();
  const [data, setData] = useState('');
  if (!modals.import) return null;
  const doImport = () => {
    try {
      const json = JSON.parse(data);
      if (json.leads) { setLeads(p => [...p, ...json.leads.map(l => ({ ...l, id: generateId() }))]); notify(' Imported!'); closeModal('import'); setData(''); return; }
    } catch { /* not JSON */ }
    const lines = data.trim().split('\n');
    if (lines.length < 2) { notify(' No data'); return; }
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
    if (newLeads.length) { setLeads(p => [...p, ...newLeads]); notify(` Imported ${newLeads.length} leads!`); closeModal('import'); setData(''); }
    else notify(' No valid leads');
  };
  return (
    <Modal onClose={() => closeModal('import')}>
      <ModalBox>
        <h2 style={{ color: colors.primary, marginBottom: 12, fontSize: 18 }}> Import Data</h2>
        <textarea value={data} onChange={e => setData(e.target.value)} placeholder="Paste CSV or JSON..." style={{ ...inputBase, height: 180, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button onClick={doImport} style={{ ...buttonBase, flex: 1, background: colors.primary, color: '#fff' }}>Import</button>
          <button onClick={() => closeModal('import')} style={{ ...buttonBase, background: colors.bgCard, color: colors.text }}>Cancel</button>
        </div>
      </ModalBox>
    </Modal>
  );
}

export function ExportModal() {
  const { modals, closeModal, leads, dncList, deadLeads, convertedLeads, callLog, golfCourses, sales, dailyStats, settings, notify } = useCRM();
  if (!modals.export) return null;
  const exportData = (type) => {
    if (type === 'all') {
      const blob = new Blob([JSON.stringify({ leads, dncList, deadLeads, convertedLeads, callLog, dailyStats, golfCourses, sales, settings, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'crm_backup.json'; a.click();
      notify('📦 Backup exported!'); closeModal('export'); return;
    }
    const exports = {
      leads: { h: ['Business', 'Contact', 'Phone', 'Email', 'Industry'], d: leads.map(l => [l.businessName, l.contactName, l.phone, l.email, l.industry]), f: 'leads.csv' },
      sales: { h: ['Lead', 'Date', 'Type', 'Amount'], d: sales.map(s => [s.leadName, formatDate(s.saleDate), s.saleType, s.amount]), f: 'sales.csv' },
    };
    const exp = exports[type]; if (!exp) return;
    const csv = [exp.h, ...exp.d].map(row => row.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = exp.f; a.click();
    notify('📊 Exported!'); closeModal('export');
  };
  return (
    <Modal onClose={() => closeModal('export')}>
      <ModalBox maxWidth={400}>
        <h2 style={{ color: colors.warning, marginBottom: 20, fontSize: 18 }}>📤 Export</h2>
        {[['leads', `Leads (${leads.length})`, colors.success], ['sales', `Sales (${sales.length})`, colors.warning], ['all', 'Full Backup', colors.text]].map(([k, l, c]) => (
          <button key={k} onClick={() => exportData(k)} style={{ ...buttonBase, width: '100%', marginBottom: 8, background: colors.bgCard, color: c, border: `1px solid ${colors.border}` }}>{l}</button>
        ))}
        <button onClick={() => closeModal('export')} style={{ ...buttonBase, width: '100%', marginTop: 8, background: colors.bg, color: colors.textMuted }}>Cancel</button>
      </ModalBox>
    </Modal>
  );
}

export function RecordSaleModal() {
  const { modals, closeModal, recordSale, leads } = useCRM();
  const [form, setForm] = useState({ type: 'single', amount: 395, saleCount: 1, leadId: '', leadName: '', notes: '' });
  if (!modals.recordSale) return null;

  const handleTypeChange = (type) => {
    const saleType = SALE_TYPES.find(s => s.key === type);
    setForm(f => ({ ...f, type, amount: saleType?.price || 0, saleCount: saleType?.saleCount || 1 }));
  };

  const handleSubmit = () => {
    if (!form.amount) return;
    recordSale({ ...form, leadName: form.leadName || leads.find(l => l.id === form.leadId)?.businessName || 'Direct Sale' });
  };

  return (
    <Modal onClose={() => closeModal('recordSale')}>
      <ModalBox maxWidth={450}>
        <h2 style={{ color: colors.warning, marginBottom: 20, fontSize: 20 }}>💰 Record Sale</h2>
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Sale Type</label>
            <select value={form.type} onChange={e => handleTypeChange(e.target.value)} style={inputBase}>
              {SALE_TYPES.map(t => <option key={t.key} value={t.key}>{t.label} {t.price > 0 && `- $${t.price}`}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Amount ($)</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseInt(e.target.value) || 0 }))} style={inputBase} />
          </div>
          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Sale Count (banners)</label>
            <input type="number" value={form.saleCount} onChange={e => setForm(f => ({ ...f, saleCount: parseInt(e.target.value) || 1 }))} style={inputBase} />
          </div>
          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Link to Lead (optional)</label>
            <select value={form.leadId} onChange={e => setForm(f => ({ ...f, leadId: e.target.value }))} style={inputBase}>
              <option value="">Direct Sale / Walk-in</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.businessName}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Notes</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." style={inputBase} />
          </div>
        </div>
        <div style={{ background: colors.bgCard, padding: 16, borderRadius: 10, marginTop: 16, textAlign: 'center' }}>
          <div style={{ color: colors.success, fontSize: 32, fontWeight: '700' }}>${form.amount.toLocaleString()}</div>
          <div style={{ color: colors.textMuted, fontSize: 12 }}>{form.saleCount} sale{form.saleCount > 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button onClick={handleSubmit} style={{ ...buttonBase, flex: 1, background: colors.success, color: '#fff', fontSize: 16 }}>🎉 Record Sale!</button>
          <button onClick={() => closeModal('recordSale')} style={{ ...buttonBase, background: colors.bgCard, color: colors.text }}>Cancel</button>
        </div>
      </ModalBox>
    </Modal>
  );
}

export function LeadDetailModal() {
  const { modals, closeModal, openModal, updateLead, moveToDNC, moveToDead, convertLead, deleteToTrash, tallyCall, quickLogEmail, deleteCall } = useCRM();
  const [showConvert, setShowConvert] = useState(false);
  const [saleForm, setSaleForm] = useState({ type: 'single', amount: 395, saleCount: 1, notes: '' });
  const lead = modals.leadDetail;
  if (!lead) return null;

  const handleTypeChange = (type) => {
    const saleType = SALE_TYPES.find(s => s.key === type);
    setSaleForm(f => ({ ...f, type, amount: saleType?.price || 0, saleCount: saleType?.saleCount || 1 }));
  };

  const handleConvert = () => {
    convertLead(lead, saleForm);
    closeModal('leadDetail');
    setShowConvert(false);
  };

  const setFollowUp = (days) => {
    const d = new Date(); d.setDate(d.getDate() + days);
    updateLead({ ...lead, followUp: `${d.toISOString().split('T')[0]}T12:00:00` });
  };

  if (showConvert) {
    return (
      <Modal onClose={() => setShowConvert(false)}>
        <ModalBox maxWidth={450}>
          <h2 style={{ color: colors.success, marginBottom: 20, fontSize: 20 }}>🎉 Convert: {lead.businessName}</h2>
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Sale Type</label>
              <select value={saleForm.type} onChange={e => handleTypeChange(e.target.value)} style={inputBase}>
                {SALE_TYPES.map(t => <option key={t.key} value={t.key}>{t.label} {t.price > 0 && `- $${t.price}`}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Amount ($)</label>
              <input type="number" value={saleForm.amount} onChange={e => setSaleForm(f => ({ ...f, amount: parseInt(e.target.value) || 0 }))} style={inputBase} />
            </div>
            <div>
              <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Sale Count</label>
              <input type="number" value={saleForm.saleCount} onChange={e => setSaleForm(f => ({ ...f, saleCount: parseInt(e.target.value) || 1 }))} style={inputBase} />
            </div>
          </div>
          <div style={{ background: colors.bgCard, padding: 16, borderRadius: 10, marginTop: 16, textAlign: 'center' }}>
            <div style={{ color: colors.success, fontSize: 32, fontWeight: '700' }}>${saleForm.amount.toLocaleString()}</div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button onClick={handleConvert} style={{ ...buttonBase, flex: 1, background: colors.success, color: '#fff', fontSize: 16 }}>🎉 Confirm Sale!</button>
            <button onClick={() => setShowConvert(false)} style={{ ...buttonBase, background: colors.bgCard, color: colors.text }}>Back</button>
          </div>
        </ModalBox>
      </Modal>
    );
  }

  return (
    <Modal onClose={() => closeModal('leadDetail')}>
      <ModalBox maxWidth={750}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ color: colors.text, fontSize: 22 }}>{lead.priority === 'hot' && '🔥 '}{lead.businessName}</h2>
            <p style={{ color: colors.textMuted }}>{lead.contactName} {lead.industry && `• ${lead.industry}`}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => openModal('editLead', lead)} style={{ ...buttonBase, background: colors.bgCard, color: colors.primary }}>✏️</button>
            <button onClick={() => tallyCall(lead)} style={{ ...buttonBase, background: colors.success, color: '#fff' }}>📞</button>
            {lead.email && <button onClick={() => quickLogEmail(lead)} style={{ ...buttonBase, background: colors.primary, color: '#fff' }}>📧</button>}
            <button onClick={() => closeModal('leadDetail')} style={{ ...buttonBase, background: colors.bgCard, color: colors.textMuted }}><IconX size={16} /></button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[['Phone', lead.phone], ['Email', lead.email], ['Website', lead.website], ['Source', lead.source]].map(([label, val]) => (
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
            <div style={{ color: colors.textDim, fontSize: 11, marginBottom: 8, textTransform: 'uppercase' }}>Call History ({lead.callHistory.length})</div>
            <div style={{ maxHeight: 100, overflowY: 'auto' }}>
              {lead.callHistory.slice().reverse().slice(0, 5).map((c, i) => (
                <div key={i} style={{ padding: 8, background: colors.bgCard, borderRadius: 6, marginBottom: 4, fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.textMuted }}>{formatDateTime(c.timestamp)}</span>
                  <button onClick={() => deleteCall(c.id)} style={{ background: 'transparent', border: 'none', color: colors.danger, cursor: 'pointer', fontSize: 10 }}>️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: `1px solid ${colors.border}`, flexWrap: 'wrap' }}>
          <button onClick={() => { moveToDNC(lead); closeModal('leadDetail'); }} style={{ ...buttonBase, background: colors.warning, color: '#000' }}>🚫 DNC</button>
          <button onClick={() => { moveToDead(lead); closeModal('leadDetail'); }} style={{ ...buttonBase, background: colors.danger, color: '#fff' }}>💀 Dead</button>
          <button onClick={() => setShowConvert(true)} style={{ ...buttonBase, background: colors.success, color: '#fff', fontWeight: '600' }}>🎉 Convert + Sale</button>
          <button onClick={() => deleteToTrash(lead, 'lead')} style={{ ...buttonBase, background: colors.bgCard, color: colors.danger, marginLeft: 'auto' }}>️</button>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: colors.text, fontSize: 18 }}>✏️ Edit Lead</h2>
          <button onClick={() => closeModal('editLead')} style={{ ...buttonBase, background: colors.bgCard, color: colors.textMuted }}><IconX size={16} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[['businessName', 'Business Name', 2], ['contactName', 'Contact', 1], ['phone', 'Phone', 1], ['email', 'Email', 1], ['website', 'Website', 1], ['address', 'Address', 2]].map(([key, label, span]) => (
            <div key={key} style={{ gridColumn: `span ${span}` }}>
              <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>{label}</label>
              <input value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inputBase} />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Industry</label>
            <select value={form.industry || ''} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} style={inputBase}>
              <option value="">Select...</option>
              {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Source</label>
            <select value={form.source || ''} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} style={inputBase}>
              <option value="">Select...</option>
              {SOURCES.map(src => <option key={src} value={src}>{src}</option>)}
            </select>
          </div>
          <DateInput value={form.followUp} onChange={val => setForm(f => ({ ...f, followUp: val }))} label="Follow-up" />
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: colors.text, fontSize: 18 }}>✏️ Edit Call</h2>
          <button onClick={() => closeModal('editCall')} style={{ ...buttonBase, background: colors.bgCard, color: colors.textMuted }}><IconX size={16} /></button>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Lead Name</label><input value={form.leadName || ''} onChange={e => setForm(f => ({ ...f, leadName: e.target.value }))} style={inputBase} /></div>
          <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Phone</label><input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputBase} /></div>
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
      <ModalBox><h2 style={{ color: colors.text, marginBottom: 16 }}>Privacy Policy</h2><p style={{ color: colors.textMuted }}>All data is stored locally in your browser. Nothing leaves your device.</p><button onClick={() => closeModal('privacy')} style={{ ...buttonBase, width: '100%', marginTop: 20, background: colors.bgCard, color: colors.text }}>Close</button></ModalBox>
    </Modal>
  );
}

export function TermsModal() {
  const { modals, closeModal } = useCRM();
  if (!modals.terms) return null;
  return (
    <Modal onClose={() => closeModal('terms')}>
      <ModalBox><h2 style={{ color: colors.text, marginBottom: 16 }}>Terms of Use</h2><p style={{ color: colors.textMuted }}>Use at your own risk. Data stored locally. No warranties provided.</p><button onClick={() => closeModal('terms')} style={{ ...buttonBase, width: '100%', marginTop: 20, background: colors.bgCard, color: colors.text }}>Close</button></ModalBox>
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
      <RecordSaleModal />
      <LeadDetailModal />
      <EditLeadModal />
      <EditCallModal />
      <EditGolfCourseModal />
      <PrivacyModal />
      <TermsModal />
    </>
  );
}