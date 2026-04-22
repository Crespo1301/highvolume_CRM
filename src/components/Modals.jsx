import React, { useState, useRef } from 'react';
import { useCRM } from '../context/CRMContext';
import { colors, buttonBase, inputBase } from '../utils/theme.jsx';
import { formatDate, formatFollowUpDisplay, formatDateTime, formatDateForInput, formatDateDisplay, isOverdue, generateId, INDUSTRIES, SOURCES, parseDateInput, SALE_TYPES, MARKET_PRESETS, WEBSITE_STATUS_OPTIONS, OUTREACH_STATUS_OPTIONS, scoreLead, classifyPriorityFromScore, EMAIL_SEQUENCE_STEPS, generateEmailDraft, getEmailSequenceStep } from '../utils/helpers';
import { IconX } from './Icons';
import { EnhancedHelpModal } from './HelpPanel';

const Modal = ({ children, onClose }) => {
  React.useEffect(() => {
    if (!onClose) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
};

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
    ['More Nav', [['G', 'Markets'], ['T', 'Trash'], ['A', 'Analytics'], ['-', 'Emails']]],
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
          <label style={{ display: 'block', color: colors.textMuted, marginBottom: 6, fontSize: 12 }}>Active Market</label>
          <select value={settings.activeGolfCourse || ''} onChange={e => setSettings(p => ({ ...p, activeGolfCourse: e.target.value || null }))} style={inputBase}>
            <option value="">None</option>
            {golfCourses.map(gc => <option key={gc.id} value={gc.id}>{gc.name}</option>)}
          </select>
        </div>
        {/* Revenue goals */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: colors.textMuted, marginBottom: 6, fontSize: 12 }}>Daily Revenue Goal ($)</label>
          <input type="number" value={settings.dailyRevenueGoal || 0} onChange={e => setSettings(p => ({ ...p, dailyRevenueGoal: parseFloat(e.target.value) || 0 }))} style={inputBase} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: colors.textMuted, marginBottom: 6, fontSize: 12 }}>Weekly Revenue Goal ($)</label>
          <input type="number" value={settings.weeklyRevenueGoal || 0} onChange={e => setSettings(p => ({ ...p, weeklyRevenueGoal: parseFloat(e.target.value) || 0 }))} style={inputBase} />
        </div>

        {/* Quotas */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: colors.textMuted, marginBottom: 6, fontSize: 12 }}>Quota Month</label>
          <input type="month" value={settings.quotaMonth || ''} onChange={e => setSettings(p => ({ ...p, quotaMonth: e.target.value }))} style={inputBase} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: colors.textMuted, marginBottom: 6, fontSize: 12 }}>Monthly Quota ($)</label>
          <input type="number" value={settings.monthlyQuota || 0} onChange={e => setSettings(p => ({ ...p, monthlyQuota: parseFloat(e.target.value) || 0 }))} style={inputBase} />
        </div>

        <button onClick={clearAllData} style={{ ...buttonBase, width: '100%', background: colors.danger, color: '#fff', marginBottom: 10 }}>️ Clear All Data</button>
        <button onClick={() => closeModal('settings')} style={{ ...buttonBase, width: '100%', background: colors.bgCard, color: colors.text }}>Close</button>
      </ModalBox>
    </Modal>
  );
}

export function ImportModal() {
  const { modals, closeModal, setLeads, settings, notify, importGooglePlacesLeads, importFacebookLeads, enrichExistingLeads, bulkFindLeadEmails, golfCourses, importJobs, setImportJobs } = useCRM();
  const [data, setData] = useState('');
  const [facebookData, setFacebookData] = useState('');
  const [placesForm, setPlacesForm] = useState({
    marketKey: 'renton',
    industry: 'Contractor / Home Services',
    maxResults: 10,
    golfCourseId: settings.activeGolfCourse || ''
  });
  const [facebookForm, setFacebookForm] = useState({
    marketKey: 'renton',
    industry: 'Contractor / Home Services',
    golfCourseId: settings.activeGolfCourse || ''
  });
  const [enrichmentForm, setEnrichmentForm] = useState({
    target: 'missingWebsiteStatus',
    golfCourseId: 'all',
    marketKey: 'renton'
  });
  const [emailDiscoveryForm, setEmailDiscoveryForm] = useState({
    golfCourseId: 'all'
  });
  const [isImportingPlaces, setIsImportingPlaces] = useState(false);
  const [isImportingFacebook, setIsImportingFacebook] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isDiscoveringEmails, setIsDiscoveringEmails] = useState(false);
  if (!modals.import) return null;
  const findGolfCourseIdByName = (value = '') => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return '';
    return golfCourses.find(gc => (gc.name || '').trim().toLowerCase() === normalized)?.id || '';
  };

  const buildImportedLead = (draft = {}) => {
    const priorityScore = scoreLead(draft);
    return {
      id: generateId(),
      createdAt: new Date().toISOString(),
      callCount: 0,
      callHistory: [],
      websiteStatus: draft.websiteStatus || 'unknown',
      source: draft.source || 'Import',
      golfCourseId: draft.golfCourseId || settings.activeGolfCourse,
      priorityScore,
      priority: draft.priority || classifyPriorityFromScore(priorityScore),
      ...draft,
    };
  };

  const doImport = () => {
    try {
      const json = JSON.parse(data);
      if (json.leads) {
        const imported = json.leads.map(l => buildImportedLead(l));
        setLeads(p => [...p, ...imported]);
        setImportJobs(prev => [{
          id: generateId(),
          sourceType: 'json',
          label: 'Manual JSON import',
          createdAt: new Date().toISOString(),
          addedCount: imported.length,
          skippedCount: 0,
          golfCourseId: settings.activeGolfCourse || ''
        }, ...prev].slice(0, 25));
        notify(' Imported!');
        closeModal('import');
        setData('');
        return;
      }
    } catch { /* not JSON */ }
    const lines = data.trim().split('\n');
    if (lines.length < 2) { notify(' No data'); return; }
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
    const newLeads = lines.slice(1).map(line => {
      const vals = line.match(/(".*?"|[^,]+)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || [];
      const lead = {};
      headers.forEach((h, i) => {
        const v = vals[i] || '';
        if (h.includes('business') || h.includes('company')) lead.businessName = v;
        else if (h.includes('contact') || h === 'name') lead.contactName = v;
        else if (h.includes('phone')) lead.phone = v;
        else if (h.includes('email')) lead.email = v;
        else if (h.includes('website status')) lead.websiteStatus = v;
        else if (h === 'status') lead.websiteStatus = v;
        else if (h.includes('website') || h.includes('url')) lead.website = v;
        else if (h.includes('address') || h.includes('street')) lead.address = v;
        else if (h === 'city' || h.includes('city')) lead.city = v;
        else if (h.includes('state') || h.includes('region')) lead.region = v;
        else if (h.includes('industry') || h.includes('category')) lead.industry = v;
        else if (h.includes('source')) lead.source = v;
        else if (h.includes('follow')) lead.followUp = v;
        else if (h.includes('priority')) lead.priority = v.toLowerCase();
        else if (h.includes('market') || h.includes('list')) lead.golfCourseId = findGolfCourseIdByName(v);
        else if (h.includes('note')) lead.notes = v;
      });
      return buildImportedLead(lead);
    }).filter(l => l.businessName || l.phone);
    if (newLeads.length) {
      setLeads(p => [...p, ...newLeads]);
      setImportJobs(prev => [{
        id: generateId(),
        sourceType: 'csv',
        label: 'Manual CSV import',
        createdAt: new Date().toISOString(),
        addedCount: newLeads.length,
        skippedCount: 0,
        golfCourseId: settings.activeGolfCourse || ''
      }, ...prev].slice(0, 25));
      notify(` Imported ${newLeads.length} leads!`);
      closeModal('import');
      setData('');
    }
    else notify(' No valid leads');
  };
  const doGooglePlacesImport = async () => {
    setIsImportingPlaces(true);
    try {
      const result = await importGooglePlacesLeads(placesForm);
      if (result?.addedCount > 0) closeModal('import');
    } catch (error) {
      notify(` ${error.message || 'Google Places import failed'}`);
    } finally {
      setIsImportingPlaces(false);
    }
  };

  const doFacebookImport = async () => {
    setIsImportingFacebook(true);
    try {
      const result = await importFacebookLeads({
        data: facebookData,
        marketKey: facebookForm.marketKey,
        industry: facebookForm.industry,
        golfCourseId: facebookForm.golfCourseId
      });
      if (result?.addedCount > 0) {
        setFacebookData('');
      }
    } catch (error) {
      notify(` ${error.message || 'Facebook import failed'}`);
    } finally {
      setIsImportingFacebook(false);
    }
  };

  const doEnrichment = async () => {
    setIsEnriching(true);
    try {
      enrichExistingLeads(enrichmentForm);
    } catch (error) {
      notify(` ${error.message || 'Lead enrichment failed'}`);
    } finally {
      setIsEnriching(false);
    }
  };
  const doEmailDiscovery = async () => {
    setIsDiscoveringEmails(true);
    try {
      await bulkFindLeadEmails({
        golfCourseId: emailDiscoveryForm.golfCourseId,
        onlyMissingEmail: true
      });
    } catch (error) {
      notify(` ${error.message || 'Bulk email discovery failed'}`);
    } finally {
      setIsDiscoveringEmails(false);
    }
  };
  return (
    <Modal onClose={() => closeModal('import')}>
      <ModalBox>
        <h2 style={{ color: colors.primary, marginBottom: 12, fontSize: 18 }}> Import Data</h2>
        <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16, marginBottom: 16, background: colors.bgCard }}>
          <h3 style={{ color: colors.text, marginBottom: 12, fontSize: 15 }}>Google Places Import</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Market</label>
              <select value={placesForm.marketKey} onChange={e => setPlacesForm(f => ({ ...f, marketKey: e.target.value }))} style={inputBase}>
                {MARKET_PRESETS.map(preset => <option key={preset.key} value={preset.key}>{preset.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Industry</label>
              <select value={placesForm.industry} onChange={e => setPlacesForm(f => ({ ...f, industry: e.target.value }))} style={inputBase}>
                {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Max Results</label>
              <select value={placesForm.maxResults} onChange={e => setPlacesForm(f => ({ ...f, maxResults: parseInt(e.target.value, 10) || 10 }))} style={inputBase}>
                {[5, 10, 15, 20].map(count => <option key={count} value={count}>{count}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Assign Market</label>
              <select value={placesForm.golfCourseId} onChange={e => setPlacesForm(f => ({ ...f, golfCourseId: e.target.value }))} style={inputBase}>
                <option value="">Auto / Active Market</option>
                {golfCourses.map(gc => <option key={gc.id} value={gc.id}>{gc.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 10, color: colors.textDim, fontSize: 12 }}>
            Uses the official Google Places API to search businesses and prefill CRM records with address, phone, website, rating, and market metadata.
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
            <button onClick={doGooglePlacesImport} disabled={isImportingPlaces} style={{ ...buttonBase, flex: 1, background: colors.success, color: '#fff' }}>
              {isImportingPlaces ? 'Importing…' : 'Import from Google Places'}
            </button>
          </div>
        </div>
        <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16, marginBottom: 16, background: colors.bgCard }}>
          <h3 style={{ color: colors.text, marginBottom: 12, fontSize: 15 }}>Facebook Lead Intake</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Market</label>
              <select value={facebookForm.marketKey} onChange={e => setFacebookForm(f => ({ ...f, marketKey: e.target.value }))} style={inputBase}>
                {MARKET_PRESETS.map(preset => <option key={preset.key} value={preset.key}>{preset.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Industry</label>
              <select value={facebookForm.industry} onChange={e => setFacebookForm(f => ({ ...f, industry: e.target.value }))} style={inputBase}>
                {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Assign Market</label>
              <select value={facebookForm.golfCourseId} onChange={e => setFacebookForm(f => ({ ...f, golfCourseId: e.target.value }))} style={inputBase}>
                <option value="">Auto / Active Market</option>
                {golfCourses.map(gc => <option key={gc.id} value={gc.id}>{gc.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 10, color: colors.textDim, fontSize: 12 }}>
            Paste one lead per line as `Business Name | Facebook URL | Phone | Email | Website | City | Region`, or paste one JSON object per line.
          </div>
          <textarea value={facebookData} onChange={e => setFacebookData(e.target.value)} placeholder="Wildflower Hair Studio | https://facebook.com/example | (253) 555-1212 | hello@example.com | https://example.com | Renton | WA" style={{ ...inputBase, marginTop: 10, height: 110, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
            <button onClick={doFacebookImport} disabled={isImportingFacebook} style={{ ...buttonBase, flex: 1, background: colors.accent, color: '#fff' }}>
              {isImportingFacebook ? 'Importing...' : 'Import Facebook Leads'}
            </button>
          </div>
        </div>
        <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16, marginBottom: 16, background: colors.bgCard }}>
          <h3 style={{ color: colors.text, marginBottom: 12, fontSize: 15 }}>Bulk Lead Enrichment</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Target</label>
              <select value={enrichmentForm.target} onChange={e => setEnrichmentForm(f => ({ ...f, target: e.target.value }))} style={inputBase}>
                <option value="missingWebsiteStatus">Missing website status</option>
                <option value="missingLocation">Missing city or region</option>
                <option value="facebookOnly">Facebook-linked leads</option>
                <option value="all">All leads</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Scope</label>
              <select value={enrichmentForm.golfCourseId} onChange={e => setEnrichmentForm(f => ({ ...f, golfCourseId: e.target.value }))} style={inputBase}>
                <option value="all">All Markets</option>
                {golfCourses.map(gc => <option key={gc.id} value={gc.id}>{gc.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Fallback Market</label>
              <select value={enrichmentForm.marketKey} onChange={e => setEnrichmentForm(f => ({ ...f, marketKey: e.target.value }))} style={inputBase}>
                {MARKET_PRESETS.map(preset => <option key={preset.key} value={preset.key}>{preset.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 10, color: colors.textDim, fontSize: 12 }}>
            Recalculates website status, priority, and outreach angle, and can backfill missing city or region from a selected market preset.
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
            <button onClick={doEnrichment} disabled={isEnriching} style={{ ...buttonBase, flex: 1, background: colors.warning, color: '#000' }}>
              {isEnriching ? 'Enriching...' : 'Run Enrichment'}
            </button>
          </div>
        </div>
        <div style={{ border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16, marginBottom: 16, background: colors.bgCard }}>
          <h3 style={{ color: colors.text, marginBottom: 12, fontSize: 15 }}>Bulk Email Discovery</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Scope</label>
              <select value={emailDiscoveryForm.golfCourseId} onChange={e => setEmailDiscoveryForm(f => ({ ...f, golfCourseId: e.target.value }))} style={inputBase}>
                <option value="all">All Markets</option>
                {golfCourses.map(gc => <option key={gc.id} value={gc.id}>{gc.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 10, color: colors.textDim, fontSize: 12 }}>
            Scans websites for leads that are still missing email addresses and saves any discovered contact email back to the lead record.
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
            <button onClick={doEmailDiscovery} disabled={isDiscoveringEmails} style={{ ...buttonBase, flex: 1, background: colors.primary, color: '#fff' }}>
              {isDiscoveringEmails ? 'Discovering...' : 'Find Emails for Missing Leads'}
            </button>
          </div>
        </div>
        <div style={{ color: colors.textDim, fontSize: 12, marginBottom: 8 }}>Or paste CSV / JSON manually</div>
        <textarea value={data} onChange={e => setData(e.target.value)} placeholder="Paste CSV or JSON..." style={{ ...inputBase, height: 180, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button onClick={doImport} style={{ ...buttonBase, flex: 1, background: colors.primary, color: '#fff' }}>Import</button>
          <button onClick={() => closeModal('import')} style={{ ...buttonBase, background: colors.bgCard, color: colors.text }}>Cancel</button>
        </div>
        {importJobs?.length > 0 && (
          <div style={{ marginTop: 18, borderTop: `1px solid ${colors.border}`, paddingTop: 14 }}>
            <div style={{ color: colors.textDim, fontSize: 11, marginBottom: 8, textTransform: 'uppercase' }}>Recent Imports</div>
            <div style={{ display: 'grid', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
              {importJobs.slice(0, 5).map(job => (
                <div key={job.id} style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>{job.label || job.sourceType}</div>
                      <div style={{ color: colors.textMuted, fontSize: 11 }}>{formatDateTime(job.createdAt)}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 11 }}>
                      <div style={{ color: colors.success }}>{job.addedCount || 0} added</div>
                      {!!job.skippedCount && <div style={{ color: colors.warning }}>{job.skippedCount} skipped</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
      leads: {
        h: ['Business', 'Contact', 'Phone', 'Email', 'Website', 'Website Status', 'Address', 'City', 'Region', 'Industry', 'Source', 'Priority', 'Priority Score', 'Market', 'Notes'],
        d: leads.map(l => [
          l.businessName,
          l.contactName,
          l.phone,
          l.email,
          l.website,
          l.websiteStatus,
          l.address,
          l.city,
          l.region,
          l.industry,
          l.source,
          l.priority,
          l.priorityScore,
          golfCourses.find(gc => gc.id === l.golfCourseId)?.name || '',
          l.notes
        ]),
        f: 'leads.csv'
      },
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
  const { modals, closeModal, openModal, updateLead, moveToDNC, moveToDead, convertLead, deleteToTrash, tallyCall, openEmailComposer, deleteCall, audits, generateLeadAudit, updateOutreachStatus, findLeadEmail, notify } = useCRM();
  const [showConvert, setShowConvert] = useState(false);
  const [saleForm, setSaleForm] = useState({ type: 'single', amount: 395, saleCount: 1, notes: '' });
  const [isFindingEmail, setIsFindingEmail] = useState(false);
  const lead = modals.leadDetail;
  const latestAudit = (audits || []).find(audit => audit.leadId === lead?.id);
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

  const handleFindEmail = async () => {
    setIsFindingEmail(true);
    try {
      await findLeadEmail(lead);
    } catch (error) {
      notify(error.message || 'Unable to find email for this lead.');
    } finally {
      setIsFindingEmail(false);
    }
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
            {lead.email && <button onClick={() => openEmailComposer(lead)} style={{ ...buttonBase, background: colors.primary, color: '#fff' }}>📧</button>}
            <button onClick={() => closeModal('leadDetail')} style={{ ...buttonBase, background: colors.bgCard, color: colors.textMuted }}><IconX size={16} /></button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            ['Phone', lead.phone],
            ['Email', lead.email],
            ['Website', lead.website],
            ['Location', [lead.city, lead.region].filter(Boolean).join(', ') || lead.address],
            ['Website Status', WEBSITE_STATUS_OPTIONS.find(option => option.value === lead.websiteStatus)?.label || lead.websiteStatus],
            ['Source', lead.source]
          ].map(([label, val]) => (
            <div key={label} style={{ background: colors.bgCard, padding: 14, borderRadius: 10 }}>
              <div style={{ color: colors.textDim, fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14 }}>{val || '—'}</div>
            </div>
          ))}
        </div>

        {(lead.website || lead.emailDiscoveryStatus !== 'not_run') && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: colors.textDim, fontSize: 11, marginBottom: 8, textTransform: 'uppercase' }}>Email Discovery</div>
            <div style={{ background: colors.bgCard, padding: 14, borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: '600' }}>
                    {lead.email || 'No email on file'}
                  </div>
                  <div style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
                    Status: {lead.emailDiscoveryStatus || 'not_run'}
                    {lead.emailConfidence ? ` â€¢ confidence ${lead.emailConfidence}` : ''}
                    {lead.emailSource ? ` â€¢ ${lead.emailSource}` : ''}
                  </div>
                  {lead.emailDiscoveryNotes && (
                    <div style={{ color: colors.textDim, fontSize: 11, marginTop: 6 }}>{lead.emailDiscoveryNotes}</div>
                  )}
                </div>
                <button
                  onClick={handleFindEmail}
                  disabled={isFindingEmail || !lead.website}
                  style={{
                    ...buttonBase,
                    background: !lead.website ? colors.bg : colors.primary,
                    color: !lead.website ? colors.textDim : '#fff',
                    opacity: isFindingEmail ? 0.75 : 1,
                    cursor: isFindingEmail ? 'wait' : (!lead.website ? 'not-allowed' : 'pointer')
                  }}
                >
                  {isFindingEmail ? 'Finding...' : 'Find Email'}
                </button>
              </div>
            </div>
          </div>
        )}

        {(lead.googlePlaceId || lead.googleMapsUri || typeof lead.googleRating === 'number') && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: colors.textDim, fontSize: 11, marginBottom: 8, textTransform: 'uppercase' }}>Google Import</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div style={{ background: colors.bgCard, padding: 14, borderRadius: 10 }}>
                <div style={{ color: colors.textDim, fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>Rating</div>
                <div style={{ fontSize: 14 }}>
                  {typeof lead.googleRating === 'number' ? `${lead.googleRating.toFixed(1)}${lead.googleReviewCount ? ` (${lead.googleReviewCount} reviews)` : ''}` : '—'}
                </div>
              </div>
              <div style={{ background: colors.bgCard, padding: 14, borderRadius: 10 }}>
                <div style={{ color: colors.textDim, fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>Business Status</div>
                <div style={{ fontSize: 14 }}>{lead.googleBusinessStatus || '—'}</div>
              </div>
              <div style={{ background: colors.bgCard, padding: 14, borderRadius: 10 }}>
                <div style={{ color: colors.textDim, fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>Maps Link</div>
                <div style={{ fontSize: 14, wordBreak: 'break-word' }}>
                  {lead.googleMapsUri ? <a href={lead.googleMapsUri} target="_blank" rel="noreferrer" style={{ color: colors.primary }}>Open Maps</a> : '—'}
                </div>
              </div>
            </div>
          </div>
        )}

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
            <div style={{ fontSize: 13, marginTop: 4, color: isOverdue(lead.followUp) ? colors.danger : colors.text }}>{formatFollowUpDisplay(lead.followUp) || '—'}</div>
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

        {lead.outreachAngle && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: colors.textDim, fontSize: 11, marginBottom: 8, textTransform: 'uppercase' }}>Outreach Angle</div>
            <div style={{ background: colors.bgCard, padding: 14, borderRadius: 10, fontSize: 13 }}>{lead.outreachAngle}</div>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <div style={{ color: colors.textDim, fontSize: 11, marginBottom: 8, textTransform: 'uppercase' }}>Outreach Status</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {OUTREACH_STATUS_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => updateOutreachStatus(lead.id, option.value)}
                style={{
                  ...buttonBase,
                  padding: '8px 12px',
                  background: lead.outreachStatus === option.value ? colors.primary : colors.bgCard,
                  color: lead.outreachStatus === option.value ? '#fff' : colors.text,
                  border: `1px solid ${lead.outreachStatus === option.value ? colors.primary : colors.border}`,
                  fontSize: 12
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {latestAudit && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ color: colors.textDim, fontSize: 11, textTransform: 'uppercase' }}>Latest Audit</div>
              <div style={{ color: colors.textDim, fontSize: 11 }}>{formatDateTime(latestAudit.createdAt)}</div>
            </div>
            <div style={{ background: colors.bgCard, padding: 14, borderRadius: 10, fontSize: 13, marginBottom: 8 }}>{latestAudit.summary}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(latestAudit.talkingPoints || []).map((point, index) => (
                <span key={`${latestAudit.id}-${index}`} style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 999, fontSize: 12, background: colors.bg, border: `1px solid ${colors.border}`, color: colors.textDim }}>
                  {point}
                </span>
              ))}
            </div>
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
          <button onClick={() => generateLeadAudit(lead)} style={{ ...buttonBase, background: colors.accent, color: '#fff' }}>Audit</button>
          <button onClick={() => { moveToDNC(lead); closeModal('leadDetail'); }} style={{ ...buttonBase, background: colors.warning, color: '#000' }}>🚫 DNC</button>
          <button onClick={() => { moveToDead(lead); closeModal('leadDetail'); }} style={{ ...buttonBase, background: colors.danger, color: '#fff' }}>💀 Dead</button>
          <button onClick={() => setShowConvert(true)} style={{ ...buttonBase, background: colors.success, color: '#fff', fontWeight: '600' }}>🎉 Convert + Sale</button>
          <button onClick={() => deleteToTrash(lead, 'lead')} style={{ ...buttonBase, background: colors.bgCard, color: colors.danger, marginLeft: 'auto' }}>️</button>
        </div>
      </ModalBox>
    </Modal>
  );
}

export function ComposeEmailModal() {
  const { modals, closeModal, quickLogEmail, notify } = useCRM();
  const draft = modals.composeEmail;
  const [form, setForm] = useState(null);

  React.useEffect(() => {
    if (draft) {
      setForm(draft);
    } else {
      setForm(null);
    }
  }, [draft]);

  if (!draft || !form) return null;

  const updateForm = (patch) => setForm(prev => ({ ...prev, ...patch }));
  const selectedStep = getEmailSequenceStep(form.sequenceStep || 'intro');

  const copyText = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value || '');
      notify(`${label} copied`);
    } catch {
      notify(`Could not copy ${label.toLowerCase()}`);
    }
  };

  const openMailApp = () => {
    const query = new URLSearchParams({
      subject: form.subject || '',
      body: form.body || ''
    });
    window.location.href = `mailto:${encodeURIComponent(form.to || '')}?${query.toString()}`;
  };

  const refreshDraftForStep = (sequenceStep) => {
    const nextDraft = generateEmailDraft(form.leadSnapshot || {}, { sequenceStep });
    setForm(prev => ({
      ...prev,
      subject: nextDraft.subject,
      body: nextDraft.body,
      sequenceStep: nextDraft.sequenceStep,
      sequenceLabel: nextDraft.sequenceLabel,
      followUpDelayDays: nextDraft.suggestedDelayDays,
      scheduleFollowUp: nextDraft.suggestedDelayDays > 0
    }));
  };

  return (
    <Modal onClose={() => closeModal('composeEmail')}>
      <ModalBox maxWidth={760}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ color: colors.text, fontSize: 22, marginBottom: 6 }}>Email draft</h2>
            <p style={{ color: colors.textMuted, fontSize: 13 }}>
              Review the message for {form.leadName || form.to}, then open your mail app or log it after sending.
            </p>
          </div>
          <button onClick={() => closeModal('composeEmail')} style={{ ...buttonBase, background: colors.bgCard, color: colors.textMuted }}>
            <IconX size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', color: colors.textMuted, marginBottom: 6, fontSize: 12 }}>Sequence Step</label>
              <select value={form.sequenceStep || 'intro'} onChange={e => refreshDraftForStep(e.target.value)} style={inputBase}>
                {EMAIL_SEQUENCE_STEPS.map(step => (
                  <option key={step.value} value={step.value}>{step.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: colors.textMuted, marginBottom: 6, fontSize: 12 }}>Next Follow-up</label>
              <div style={{ ...inputBase, display: 'flex', alignItems: 'center' }}>
                <span style={{ color: form.scheduleFollowUp ? colors.text : colors.textDim }}>
                  {form.scheduleFollowUp
                    ? `${form.followUpDelayDays || selectedStep.defaultDelayDays || 0} day${(form.followUpDelayDays || selectedStep.defaultDelayDays || 0) === 1 ? '' : 's'} after send`
                    : 'No automatic follow-up'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 6, fontSize: 12 }}>To</label>
            <input
              type="email"
              value={form.to || ''}
              onChange={e => updateForm({ to: e.target.value })}
              style={inputBase}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 6, fontSize: 12 }}>Subject</label>
            <input
              type="text"
              value={form.subject || ''}
              onChange={e => updateForm({ subject: e.target.value })}
              style={inputBase}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 6, fontSize: 12 }}>Body</label>
            <textarea
              value={form.body || ''}
              onChange={e => updateForm({ body: e.target.value })}
              style={{ ...inputBase, minHeight: 240, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          <div>
            <div style={{ color: colors.textMuted, marginBottom: 8, fontSize: 12 }}>Auto-schedule next touch</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[0, 2, 4, 7, 14].map(days => {
                const isActive = (form.scheduleFollowUp ? form.followUpDelayDays : 0) === days;
                return (
                  <button
                    key={days}
                    onClick={() => updateForm({ scheduleFollowUp: days > 0, followUpDelayDays: days })}
                    style={{ ...buttonBase, padding: '8px 12px', background: isActive ? colors.primary : colors.bgCard, color: isActive ? '#fff' : colors.text }}
                  >
                    {days === 0 ? 'No follow-up' : `${days}d`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
          <button onClick={() => copyText(form.subject, 'Subject')} style={{ ...buttonBase, background: colors.bgCard, color: colors.text }}>
            Copy Subject
          </button>
          <button onClick={() => copyText(form.body, 'Body')} style={{ ...buttonBase, background: colors.bgCard, color: colors.text }}>
            Copy Body
          </button>
          <button onClick={openMailApp} style={{ ...buttonBase, background: colors.primary, color: '#fff' }}>
            Open Mail App
          </button>
          <button onClick={() => quickLogEmail(form)} style={{ ...buttonBase, background: colors.success, color: '#fff' }}>
            Log as Sent
          </button>
          <button onClick={() => closeModal('composeEmail')} style={{ ...buttonBase, background: 'transparent', color: colors.textMuted, border: `1px solid ${colors.border}` }}>
            Cancel
          </button>
        </div>
      </ModalBox>
    </Modal>
  );
}

export function EditLeadModal() {
  const { modals, closeModal, updateLead, golfCourses } = useCRM();
  const [form, setForm] = useState(null);

  React.useEffect(() => {
    if (!modals.editLead) { setForm(null); return; }
    setForm({ ...modals.editLead });
  }, [modals.editLead]);

  if (!modals.editLead || !form) return null;

  const onClose = () => { setForm(null); closeModal('editLead'); };

  return (
    <Modal onClose={onClose}>
      <ModalBox maxWidth={700}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: colors.text, fontSize: 18 }}>Edit Lead</h2>
          <button onClick={onClose} style={{ ...buttonBase, background: colors.bgCard, color: colors.textMuted }}><IconX size={16} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            ['businessName', 'Business Name', 2],
            ['contactName', 'Contact', 1],
            ['phone', 'Phone', 1],
            ['email', 'Email', 1],
            ['website', 'Website', 1],
            ['address', 'Address', 2],
            ['city', 'City', 1],
            ['region', 'State / Region', 1]
          ].map(([key, label, span]) => (
            <div key={key} style={{ gridColumn: `span ${span}` }}>
              <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>{label}</label>
              <input value={form[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} style={inputBase} />
            </div>
          ))}

          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Industry</label>
            <select value={form.industry || ''} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))} style={inputBase}>
              <option value="">Select...</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Market</label>
            <select value={form.golfCourseId || ''} onChange={e => setForm(p => ({ ...p, golfCourseId: e.target.value || null }))} style={inputBase}>
              <option value="">None</option>
              {golfCourses.map(gc => <option key={gc.id} value={gc.id}>{gc.name}</option>)}
            </select>
          </div>

          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Source</label>
            <select value={form.source || ''} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} style={inputBase}>
              <option value="">Select...</option>
              {SOURCES.map(source => <option key={source} value={source}>{source}</option>)}
            </select>
          </div>

          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Website Status</label>
            <select value={form.websiteStatus || 'unknown'} onChange={e => setForm(p => ({ ...p, websiteStatus: e.target.value }))} style={inputBase}>
              {WEBSITE_STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>

          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Follow-up Date</label>
            <input type="date" value={formatDateForInput(form.followUp)} onChange={e => setForm(p => ({ ...p, followUp: parseDateInput(e.target.value, (p.followUpTime || '')) }))} style={inputBase} />
          </div>

          <div style={{ gridColumn: 'span 1' }}>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Follow-up Time</label>
            <input type="time" value={form.followUpTime || ''} onChange={e => setForm(p => ({ ...p, followUpTime: e.target.value, followUp: parseDateInput(formatDateForInput(p.followUp), e.target.value) }))} style={inputBase} />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Notes</label>
            <textarea value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...inputBase, minHeight: 90 }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={onClose} style={{ ...buttonBase, flex: 1, background: colors.bgCard, color: colors.text }}>Cancel</button>
          <button onClick={() => { updateLead(form); onClose(); }} style={{ ...buttonBase, flex: 1, background: colors.primary, color: '#fff' }}>Save</button>
        </div>
      </ModalBox>
    </Modal>
  );
}



// Edit Sale Modal
export function EditSaleModal() {
  const { modals, closeModal, updateSale, deleteSale, leads, convertedLeads, golfCourses } = useCRM();
  const [form, setForm] = useState(null);

  const extract = (iso) => {
    if (!iso) return { date: '', time: '' };
    const s = String(iso);
    const [d, t] = s.split('T');
    return { date: d || '', time: (t || '').slice(0, 5) };
  };

  React.useEffect(() => {
    if (!modals.editSale) { setForm(null); return; }
    const sale = modals.editSale;
    const { date, time } = extract(sale.saleDate);
    setForm({
      ...sale,
      saleDateOnly: date,
      saleTimeOnly: time
    });
  }, [modals.editSale]);

  if (!modals.editSale || !form) return null;

  const onClose = () => { setForm(null); closeModal('editSale'); };

  const leadOptions = [
    ...(leads || []),
    ...(convertedLeads || [])
  ].sort((a, b) => (a.businessName || '').localeCompare(b.businessName || ''));

  const updateDateTime = (dateStr, timeStr) => {
    if (!dateStr) return '';
    const t = timeStr ? `${timeStr}:00` : '12:00:00';
    return `${dateStr}T${t}`;
  };

  const onSave = () => {
    const payload = { ...form };
    payload.saleDate = updateDateTime(form.saleDateOnly, form.saleTimeOnly);
    delete payload.saleDateOnly;
    delete payload.saleTimeOnly;
    updateSale(payload);
  };

  return (
    <Modal onClose={onClose}>
      <ModalBox maxWidth={700}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: colors.text, fontSize: 18 }}>Edit Sale</h2>
          <button onClick={onClose} style={{ ...buttonBase, background: colors.bgCard, color: colors.textMuted }}><IconX size={16} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Lead</label>
            <select
              value={form.leadId || ''}
              onChange={e => {
                const id = e.target.value || null;
                const found = leadOptions.find(l => l.id === id);
                setForm(f => ({
                  ...f,
                  leadId: id,
                  leadName: found?.businessName || f.leadName || 'Walk-in',
                  golfCourseId: found?.golfCourseId || f.golfCourseId || ''
                }));
              }}
              style={{ ...inputBase, background: colors.bg }}
            >
              <option value="">(Walk-in / Unlinked)</option>
              {leadOptions.map(l => (
                <option key={l.id} value={l.id}>{l.businessName}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Sale Type</label>
            <input value={form.saleType || ''} onChange={e => setForm(f => ({ ...f, saleType: e.target.value }))} style={inputBase} />
          </div>

          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Market</label>
            <select
              value={form.golfCourseId || ''}
              onChange={e => setForm(f => ({ ...f, golfCourseId: e.target.value }))}
              style={{ ...inputBase, background: colors.bg }}
            >
              <option value="">(None)</option>
              {(golfCourses || []).map(gc => (
                <option key={gc.id} value={gc.id}>{gc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Amount</label>
            <input type="number" value={form.amount ?? ''} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} style={inputBase} />
          </div>

          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Sale Count</label>
            <input type="number" value={form.saleCount ?? 1} onChange={e => setForm(f => ({ ...f, saleCount: Number(e.target.value) }))} style={inputBase} />
          </div>

          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Sale Date</label>
            <input type="date" value={form.saleDateOnly || ''} onChange={e => setForm(f => ({ ...f, saleDateOnly: e.target.value }))} style={inputBase} />
          </div>

          <div>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Sale Time</label>
            <input type="time" value={form.saleTimeOnly || ''} onChange={e => setForm(f => ({ ...f, saleTimeOnly: e.target.value }))} style={inputBase} />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Notes</label>
            <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...inputBase, resize: 'vertical' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button onClick={onSave} style={{ ...buttonBase, flex: 1, background: colors.success, color: '#fff' }}>Save</button>
          <button onClick={() => deleteSale(form)} style={{ ...buttonBase, background: colors.danger, color: '#fff' }}>Delete</button>
          <button onClick={onClose} style={{ ...buttonBase, background: colors.bgCard, color: colors.text }}>Cancel</button>
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
        <h2 style={{ color: colors.accent, marginBottom: 20, fontSize: 18 }}>⛳ Edit Market</h2>
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
      <EnhancedHelpModal />
      <SettingsModal />
      <ImportModal />
      <ExportModal />
      <RecordSaleModal />
      <ComposeEmailModal />
      <LeadDetailModal />
      <EditLeadModal />
      <EditSaleModal />
      <EditCallModal />
      <EditGolfCourseModal />
      <PrivacyModal />
      <TermsModal />
    </>
  );
}
