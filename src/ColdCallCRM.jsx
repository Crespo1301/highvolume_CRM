import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Storage keys
const STORAGE_KEYS = {
  leads: 'crm_leads',
  dnc: 'crm_dnc',
  dead: 'crm_dead',
  stats: 'crm_stats',
  emails: 'crm_emails',
  callLog: 'crm_call_log',
  settings: 'crm_settings'
};

const loadData = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch { return defaultValue; }
};

const saveData = (key, data) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString() : '';
const formatDateTime = (dateStr) => dateStr ? new Date(dateStr).toLocaleString() : '';
const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr); d.setHours(23,59,59);
  return d < new Date();
};
const isTodayOrPast = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr); d.setHours(23,59,59);
  return d <= new Date();
};

export default function ColdCallCRM() {
  // Core state
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState(() => loadData(STORAGE_KEYS.leads, []));
  const [dncList, setDncList] = useState(() => loadData(STORAGE_KEYS.dnc, []));
  const [deadLeads, setDeadLeads] = useState(() => loadData(STORAGE_KEYS.dead, []));
  const [emails, setEmails] = useState(() => loadData(STORAGE_KEYS.emails, []));
  const [callLog, setCallLog] = useState(() => loadData(STORAGE_KEYS.callLog, []));
  const [dailyStats, setDailyStats] = useState(() => loadData(STORAGE_KEYS.stats, {}));
  const [settings, setSettings] = useState(() => loadData(STORAGE_KEYS.settings, { dailyGoal: 200, defaultFollowUpDays: 3 }));
  
  // UI state
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [notification, setNotification] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedField, setFocusedField] = useState(0);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showLeadDetail, setShowLeadDetail] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [analyticsRange, setAnalyticsRange] = useState('week');
  
  // Form state
  const [formData, setFormData] = useState({
    businessName: '', contactName: '', phone: '', email: '', 
    address: '', website: '', industry: '', notes: '', 
    priority: 'normal', source: '', followUp: ''
  });
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '', leadId: '' });
  const [importData, setImportData] = useState('');

  // Today's calls
  const todayKey = new Date().toDateString();
  const todaysCalls = dailyStats[todayKey] || 0;

  // Persist data
  useEffect(() => { saveData(STORAGE_KEYS.leads, leads); }, [leads]);
  useEffect(() => { saveData(STORAGE_KEYS.dnc, dncList); }, [dncList]);
  useEffect(() => { saveData(STORAGE_KEYS.dead, deadLeads); }, [deadLeads]);
  useEffect(() => { saveData(STORAGE_KEYS.emails, emails); }, [emails]);
  useEffect(() => { saveData(STORAGE_KEYS.callLog, callLog); }, [callLog]);
  useEffect(() => { saveData(STORAGE_KEYS.stats, dailyStats); }, [dailyStats]);
  useEffect(() => { saveData(STORAGE_KEYS.settings, settings); }, [settings]);

  const notify = useCallback((msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 2500);
  }, []);

  // Tally call
  const tallyCall = useCallback((lead = null, outcome = 'completed', notes = '') => {
    const now = new Date().toISOString();
    const today = new Date().toDateString();
    
    setDailyStats(prev => ({ ...prev, [today]: (prev[today] || 0) + 1 }));
    
    const callEntry = {
      id: generateId(),
      timestamp: now,
      leadId: lead?.id || null,
      leadName: lead?.businessName || 'Manual Tally',
      phone: lead?.phone || '',
      outcome,
      notes
    };
    setCallLog(prev => [callEntry, ...prev.slice(0, 999)]);
    
    if (lead) {
      setLeads(prev => prev.map(l => 
        l.id === lead.id 
          ? { ...l, lastCalled: now, callCount: (l.callCount || 0) + 1,
              callHistory: [...(l.callHistory || []), { timestamp: now, outcome, notes }] }
          : l
      ));
    }
    
    notify(`📞 Call tallied! Today: ${(dailyStats[today] || 0) + 1}`);
  }, [dailyStats, notify]);

  // Follow-ups
  const followUps = useMemo(() => {
    return leads.filter(l => l.followUp && isTodayOrPast(l.followUp))
      .sort((a, b) => new Date(a.followUp) - new Date(b.followUp));
  }, [leads]);

  const overdueCount = useMemo(() => {
    return leads.filter(l => l.followUp && isOverdue(l.followUp)).length;
  }, [leads]);

  // Analytics
  const analytics = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0);
    if (analyticsRange === 'week') { startDate = new Date(now); startDate.setDate(startDate.getDate() - 7); }
    else if (analyticsRange === 'month') { startDate = new Date(now); startDate.setMonth(startDate.getMonth() - 1); }

    const filteredCalls = callLog.filter(c => new Date(c.timestamp) >= startDate);
    const filteredStats = Object.entries(dailyStats).filter(([date]) => new Date(date) >= startDate);
    
    const totalCalls = filteredCalls.length;
    const daysWithCalls = filteredStats.filter(([, count]) => count > 0).length;
    const avgPerDay = daysWithCalls > 0 ? Math.round(totalCalls / daysWithCalls) : 0;
    const maxDay = filteredStats.reduce((max, [date, count]) => count > max.count ? { date, count } : max, { date: '', count: 0 });
    
    const outcomes = filteredCalls.reduce((acc, call) => {
      acc[call.outcome] = (acc[call.outcome] || 0) + 1;
      return acc;
    }, {});

    const leadsContacted = new Set(filteredCalls.filter(c => c.leadId).map(c => c.leadId)).size;

    const dailyBreakdown = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      dailyBreakdown.push({ date: d.toLocaleDateString('en-US', { weekday: 'short' }), calls: dailyStats[d.toDateString()] || 0 });
    }

    return { totalCalls, avgPerDay, maxDay, outcomes, leadsContacted, dailyBreakdown };
  }, [callLog, dailyStats, analyticsRange]);

  // Export CSV
  const exportToCSV = useCallback((dataType) => {
    let data, filename, headers;
    
    if (dataType === 'all') {
      const allData = { leads, dncList, deadLeads, emails, callLog, dailyStats, settings, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'crm_backup.json'; a.click();
      notify('📦 Full backup exported!');
      return;
    }
    
    switch(dataType) {
      case 'leads':
        headers = ['Business Name', 'Contact', 'Phone', 'Email', 'Address', 'Website', 'Industry', 'Priority', 'Source', 'Notes', 'Calls', 'Last Called', 'Follow Up'];
        data = leads.map(l => [l.businessName, l.contactName, l.phone, l.email, l.address, l.website, l.industry, l.priority, l.source, l.notes, l.callCount || 0, formatDateTime(l.lastCalled), formatDate(l.followUp)]);
        filename = 'leads.csv';
        break;
      case 'dnc':
        headers = ['Business Name', 'Contact', 'Phone', 'Email', 'DNC Date'];
        data = dncList.map(l => [l.businessName, l.contactName, l.phone, l.email, formatDateTime(l.dncDate)]);
        filename = 'dnc.csv';
        break;
      case 'dead':
        headers = ['Business Name', 'Contact', 'Phone', 'Email', 'Dead Date'];
        data = deadLeads.map(l => [l.businessName, l.contactName, l.phone, l.email, formatDateTime(l.deadDate)]);
        filename = 'dead_leads.csv';
        break;
      case 'calls':
        headers = ['Timestamp', 'Lead', 'Phone', 'Outcome', 'Notes'];
        data = callLog.map(c => [formatDateTime(c.timestamp), c.leadName, c.phone, c.outcome, c.notes]);
        filename = 'call_log.csv';
        break;
      default: return;
    }

    const csv = [headers, ...data].map(row => row.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    notify(`📊 ${dataType} exported!`);
  }, [leads, dncList, deadLeads, callLog, emails, dailyStats, settings, notify]);

  // Import
  const importFromCSV = useCallback(() => {
    try {
      try {
        const json = JSON.parse(importData);
        if (json.leads) setLeads(prev => [...prev, ...json.leads.map(l => ({ ...l, id: generateId() }))]);
        if (json.dncList) setDncList(prev => [...prev, ...json.dncList]);
        if (json.deadLeads) setDeadLeads(prev => [...prev, ...json.deadLeads]);
        if (json.callLog) setCallLog(prev => [...prev, ...json.callLog]);
        notify('✅ JSON backup imported!');
        setShowImportModal(false); setImportData('');
        return;
      } catch {}

      const lines = importData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
      
      const newLeads = lines.slice(1).map(line => {
        const vals = line.match(/(".*?"|[^,]+)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || [];
        const lead = { id: generateId(), createdAt: new Date().toISOString(), callCount: 0, callHistory: [] };
        headers.forEach((h, i) => {
          const v = vals[i] || '';
          if (h.includes('business') || h.includes('company')) lead.businessName = v;
          else if (h.includes('contact') || h === 'name') lead.contactName = v;
          else if (h.includes('phone')) lead.phone = v;
          else if (h.includes('email')) lead.email = v;
          else if (h.includes('address')) lead.address = v;
          else if (h.includes('website')) lead.website = v;
          else if (h.includes('industry')) lead.industry = v;
          else if (h.includes('source')) lead.source = v;
          else if (h.includes('note')) lead.notes = v;
          else if (h.includes('priority')) lead.priority = v || 'normal';
        });
        return lead;
      }).filter(l => l.businessName || l.phone);

      setLeads(prev => [...prev, ...newLeads]);
      notify(`✅ Imported ${newLeads.length} leads!`);
      setShowImportModal(false); setImportData('');
    } catch { notify('❌ Import failed'); }
  }, [importData, notify]);

  // Get current list
  const getCurrentList = useCallback(() => {
    const q = searchQuery.toLowerCase();
    const filter = (item) => !q || item.businessName?.toLowerCase().includes(q) || item.contactName?.toLowerCase().includes(q) || item.phone?.includes(q);
    
    switch(view) {
      case 'leads': return leads.filter(filter);
      case 'followups': return followUps.filter(filter);
      case 'dnc': return dncList.filter(filter);
      case 'dead': return deadLeads.filter(filter);
      case 'emails': return emails;
      case 'calllog': return callLog.slice(0, 100);
      default: return [];
    }
  }, [view, leads, followUps, dncList, deadLeads, emails, callLog, searchQuery]);

  // Update lead
  const updateLead = (updated) => {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    setShowLeadDetail(updated);
    notify('✅ Lead updated');
  };

  // Set follow-up
  const setFollowUp = (lead, days) => {
    const d = new Date(); d.setDate(d.getDate() + days);
    updateLead({ ...lead, followUp: d.toISOString().split('T')[0] });
  };

  // KEYBOARD HANDLER - All features
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          e.target.blur();
          if (['addLead', 'addEmail'].includes(view)) setView('dashboard');
          setShowImportModal(false); setShowExportModal(false); setShowSettings(false); setShowLeadDetail(null);
        }
        return;
      }

      if (e.key === 'Escape') {
        setShowHelp(false); setSearchQuery(''); setShowImportModal(false); setShowExportModal(false); 
        setShowSettings(false); setShowLeadDetail(null);
        if (['addLead', 'addEmail'].includes(view)) setView('dashboard');
        return;
      }

      const list = getCurrentList();
      
      switch(e.key.toLowerCase()) {
        case ' ':
        case '0':
          e.preventDefault();
          if (['leads', 'followups'].includes(view) && list[selectedIndex]) {
            tallyCall(list[selectedIndex]);
          } else {
            tallyCall();
          }
          break;
          
        case '1':
          e.preventDefault();
          setView('dashboard'); setSelectedIndex(0);
          break;
          
        case '2':
        case 'arrowdown':
          e.preventDefault();
          if (['leads', 'followups', 'dnc', 'dead', 'emails', 'calllog'].includes(view)) {
            setSelectedIndex(prev => Math.min(prev + 1, list.length - 1));
          }
          break;
          
        case '3':
          e.preventDefault();
          setView('leads'); setSelectedIndex(0);
          break;
          
        case '4':
        case 'arrowleft':
          e.preventDefault();
          if (['leads', 'followups'].includes(view) && list[selectedIndex]) {
            const lead = list[selectedIndex];
            setLeads(prev => prev.filter(l => l.id !== lead.id));
            setDncList(prev => [...prev, { ...lead, dncDate: new Date().toISOString() }]);
            notify(`🚫 ${lead.businessName} → DNC`);
            setSelectedIndex(prev => Math.max(0, prev - 1));
          }
          break;
          
        case '5':
          e.preventDefault();
          if (['leads', 'followups'].includes(view) && list[selectedIndex]) {
            setShowLeadDetail(list[selectedIndex]);
          }
          break;
          
        case '6':
        case 'arrowright':
          e.preventDefault();
          if (['leads', 'followups'].includes(view) && list[selectedIndex]) {
            const lead = list[selectedIndex];
            setLeads(prev => prev.filter(l => l.id !== lead.id));
            setDeadLeads(prev => [...prev, { ...lead, deadDate: new Date().toISOString() }]);
            notify(`💀 ${lead.businessName} → Dead`);
            setSelectedIndex(prev => Math.max(0, prev - 1));
          }
          break;
          
        case '7':
          e.preventDefault();
          setView('dnc'); setSelectedIndex(0);
          break;
          
        case '8':
        case 'arrowup':
          e.preventDefault();
          if (['leads', 'followups', 'dnc', 'dead', 'emails', 'calllog'].includes(view)) {
            setSelectedIndex(prev => Math.max(prev - 1, 0));
          }
          break;
          
        case '9':
          e.preventDefault();
          setView('dead'); setSelectedIndex(0);
          break;
          
        case '+':
        case '=':
          e.preventDefault();
          setView('addLead');
          setFormData({ businessName: '', contactName: '', phone: '', email: '', address: '', website: '', industry: '', notes: '', priority: 'normal', source: '', followUp: '' });
          break;
          
        case '-':
          e.preventDefault();
          setView('emails'); setSelectedIndex(0);
          break;
          
        case '*':
          e.preventDefault();
          if (['leads', 'followups'].includes(view) && list[selectedIndex]) {
            setEmailForm({ to: list[selectedIndex].email || '', subject: '', body: '', leadId: list[selectedIndex].id });
          } else {
            setEmailForm({ to: '', subject: '', body: '', leadId: '' });
          }
          setView('addEmail');
          break;
          
        case '/':
        case '?':
          e.preventDefault();
          setShowHelp(prev => !prev);
          break;
          
        case 'enter':
          e.preventDefault();
          if (view === 'dnc' && list[selectedIndex]) {
            const lead = list[selectedIndex];
            setDncList(prev => prev.filter(l => l.id !== lead.id));
            setLeads(prev => [...prev, { ...lead, restoredAt: new Date().toISOString() }]);
            notify(`✅ ${lead.businessName} restored`);
            setSelectedIndex(prev => Math.max(0, prev - 1));
          } else if (view === 'dead' && list[selectedIndex]) {
            const lead = list[selectedIndex];
            setDeadLeads(prev => prev.filter(l => l.id !== lead.id));
            setLeads(prev => [...prev, { ...lead, restoredAt: new Date().toISOString() }]);
            notify(`✅ ${lead.businessName} restored`);
            setSelectedIndex(prev => Math.max(0, prev - 1));
          } else if (['leads', 'followups'].includes(view) && list[selectedIndex]) {
            setShowLeadDetail(list[selectedIndex]);
          }
          break;
          
        case 'delete':
        case '.':
          e.preventDefault();
          if (view === 'dnc' && list[selectedIndex]) {
            setDncList(prev => prev.filter(l => l.id !== list[selectedIndex].id));
            notify('Deleted'); setSelectedIndex(prev => Math.max(0, prev - 1));
          } else if (view === 'dead' && list[selectedIndex]) {
            setDeadLeads(prev => prev.filter(l => l.id !== list[selectedIndex].id));
            notify('Deleted'); setSelectedIndex(prev => Math.max(0, prev - 1));
          } else if (view === 'emails' && list[selectedIndex]) {
            setEmails(prev => prev.filter(x => x.id !== list[selectedIndex].id));
            notify('Deleted'); setSelectedIndex(prev => Math.max(0, prev - 1));
          }
          break;

        // LETTER SHORTCUTS
        case 'f':
          e.preventDefault();
          setView('followups'); setSelectedIndex(0);
          break;

        case 'a':
          e.preventDefault();
          setView('analytics');
          break;

        case 'i':
          e.preventDefault();
          setShowImportModal(true);
          break;

        case 'e':
          e.preventDefault();
          setShowExportModal(true);
          break;

        case 's':
          e.preventDefault();
          setShowSettings(true);
          break;

        case 'c':
          e.preventDefault();
          setView('calllog'); setSelectedIndex(0);
          break;
          
        default:
          // Search only if not a shortcut
          if (e.key.length === 1 && e.key.match(/[g-hj-oq-rt-z]/i) && ['leads', 'followups', 'dnc', 'dead'].includes(view)) {
            setSearchQuery(prev => prev + e.key);
            setSelectedIndex(0);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, selectedIndex, tallyCall, getCurrentList, notify]);

  // Clear search
  useEffect(() => {
    if (searchQuery) {
      const t = setTimeout(() => setSearchQuery(''), 1500);
      return () => clearTimeout(t);
    }
  }, [searchQuery]);

  // Form focus
  useEffect(() => {
    if (['addLead', 'addEmail'].includes(view)) {
      setTimeout(() => {
        const inputs = document.querySelectorAll('.form-input');
        if (inputs[0]) inputs[0].focus();
      }, 50);
    }
  }, [view]);

  // Submit handlers
  const submitLead = () => {
    if (!formData.businessName && !formData.phone) { notify('❌ Name or phone required'); return; }
    setLeads(prev => [{ id: generateId(), ...formData, createdAt: new Date().toISOString(), callCount: 0, callHistory: [] }, ...prev]);
    notify(`✅ ${formData.businessName || 'Lead'} added!`);
    setView('leads'); setSelectedIndex(0);
  };

  const submitEmail = () => {
    if (!emailForm.to || !emailForm.subject) { notify('❌ To and subject required'); return; }
    setEmails(prev => [{ id: generateId(), ...emailForm, sentAt: new Date().toISOString(), status: 'logged' }, ...prev]);
    if (emailForm.leadId) {
      setLeads(prev => prev.map(l => l.id === emailForm.leadId ? { ...l, lastEmailed: new Date().toISOString(), emailCount: (l.emailCount || 0) + 1 } : l));
    }
    notify(`📧 Email logged!`);
    setView('emails'); setSelectedIndex(0);
  };

  const progress = Math.min(100, (todaysCalls / settings.dailyGoal) * 100);
  const hotLeads = leads.filter(l => l.priority === 'hot').length;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)', color: '#e8e8e8', fontFamily: '"JetBrains Mono", "Fira Code", monospace', padding: '20px' }}>
      
      {/* Notification */}
      {notification && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: 'linear-gradient(135deg, #00d4aa, #00a080)', color: '#000', padding: '16px 24px', borderRadius: 8, fontWeight: 'bold', zIndex: 1000, boxShadow: '0 8px 32px rgba(0,212,170,0.3)' }}>
          {notification}
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }} onClick={() => setShowHelp(false)}>
          <div style={{ background: '#1a1a2e', border: '2px solid #00d4aa', borderRadius: 16, padding: 32, maxWidth: 800, width: '90%' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#00d4aa', marginBottom: 24 }}>⌨️ KEYBOARD CONTROLS</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              <div>
                <h3 style={{ color: '#ffd700', marginBottom: 12, fontSize: 14 }}>NAVIGATION</h3>
                <div style={{ lineHeight: 2, fontSize: 13 }}>
                  <div><span style={{ color: '#00d4aa' }}>1</span> Dashboard</div>
                  <div><span style={{ color: '#00d4aa' }}>3</span> Leads</div>
                  <div><span style={{ color: '#00d4aa' }}>7</span> DNC List</div>
                  <div><span style={{ color: '#00d4aa' }}>9</span> Dead Leads</div>
                  <div><span style={{ color: '#00d4aa' }}>F</span> Follow-ups</div>
                  <div><span style={{ color: '#00d4aa' }}>C</span> Call Log</div>
                  <div><span style={{ color: '#00d4aa' }}>A</span> Analytics</div>
                  <div><span style={{ color: '#00d4aa' }}>↑↓</span> Navigate</div>
                </div>
              </div>
              <div>
                <h3 style={{ color: '#ffd700', marginBottom: 12, fontSize: 14 }}>ACTIONS</h3>
                <div style={{ lineHeight: 2, fontSize: 13 }}>
                  <div><span style={{ color: '#00d4aa' }}>SPACE/0</span> Tally Call</div>
                  <div><span style={{ color: '#00d4aa' }}>5/Enter</span> View Details</div>
                  <div><span style={{ color: '#00d4aa' }}>←/4</span> Mark DNC</div>
                  <div><span style={{ color: '#00d4aa' }}>→/6</span> Mark Dead</div>
                  <div><span style={{ color: '#00d4aa' }}>+</span> Add Lead</div>
                  <div><span style={{ color: '#00d4aa' }}>*</span> Compose Email</div>
                  <div><span style={{ color: '#00d4aa' }}>-</span> Emails</div>
                </div>
              </div>
              <div>
                <h3 style={{ color: '#ffd700', marginBottom: 12, fontSize: 14 }}>DATA</h3>
                <div style={{ lineHeight: 2, fontSize: 13 }}>
                  <div><span style={{ color: '#00d4aa' }}>I</span> Import</div>
                  <div><span style={{ color: '#00d4aa' }}>E</span> Export</div>
                  <div><span style={{ color: '#00d4aa' }}>S</span> Settings</div>
                  <div><span style={{ color: '#00d4aa' }}>Del/.</span> Delete</div>
                  <div><span style={{ color: '#00d4aa' }}>Enter</span> Restore</div>
                  <div><span style={{ color: '#00d4aa' }}>/</span> Help</div>
                  <div><span style={{ color: '#00d4aa' }}>Esc</span> Close</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#1a1a2e', border: '2px solid #00a8ff', borderRadius: 16, padding: 32, maxWidth: 600, width: '90%' }}>
            <h2 style={{ color: '#00a8ff', marginBottom: 16 }}>📥 Import Data</h2>
            <p style={{ color: '#888', marginBottom: 16, fontSize: 13 }}>Paste CSV (with headers) or JSON backup</p>
            <textarea value={importData} onChange={e => setImportData(e.target.value)} placeholder="business name,phone,email..." style={{ width: '100%', height: 200, padding: 16, background: '#0a0a0f', border: '1px solid #333', borderRadius: 8, color: '#e8e8e8', fontFamily: 'inherit', fontSize: 13 }} />
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={importFromCSV} style={{ flex: 1, padding: 12, background: '#00a8ff', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit' }}>Import</button>
              <button onClick={() => setShowImportModal(false)} style={{ padding: '12px 24px', background: 'transparent', color: '#888', border: '1px solid #333', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#1a1a2e', border: '2px solid #ffd700', borderRadius: 16, padding: 32, maxWidth: 400, width: '90%' }}>
            <h2 style={{ color: '#ffd700', marginBottom: 24 }}>📤 Export Data</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { key: 'leads', label: `Leads (${leads.length})`, color: '#00d4aa' },
                { key: 'dnc', label: `DNC (${dncList.length})`, color: '#ff9f43' },
                { key: 'dead', label: `Dead (${deadLeads.length})`, color: '#ff6b6b' },
                { key: 'calls', label: `Calls (${callLog.length})`, color: '#00a8ff' },
                { key: 'all', label: 'Full Backup (JSON)', color: '#ffd700' },
              ].map(opt => (
                <button key={opt.key} onClick={() => { exportToCSV(opt.key); setShowExportModal(false); }} style={{ padding: 14, background: '#0a0a0f', color: opt.color, border: `1px solid ${opt.color}`, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>{opt.label}</button>
              ))}
            </div>
            <button onClick={() => setShowExportModal(false)} style={{ width: '100%', marginTop: 16, padding: 12, background: 'transparent', color: '#888', border: '1px solid #333', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#1a1a2e', border: '2px solid #888', borderRadius: 16, padding: 32, maxWidth: 400, width: '90%' }}>
            <h2 style={{ color: '#fff', marginBottom: 24 }}>⚙️ Settings</h2>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', color: '#888', marginBottom: 8, fontSize: 13 }}>Daily Call Goal</label>
              <input type="number" value={settings.dailyGoal} onChange={e => setSettings(prev => ({ ...prev, dailyGoal: parseInt(e.target.value) || 200 }))} style={{ width: '100%', padding: 12, background: '#0a0a0f', border: '1px solid #333', borderRadius: 8, color: '#e8e8e8', fontFamily: 'inherit', fontSize: 16 }} />
            </div>
            <button onClick={() => { if(confirm('Clear ALL data?')) { setLeads([]); setDncList([]); setDeadLeads([]); setEmails([]); setCallLog([]); setDailyStats({}); notify('🗑️ Data cleared'); setShowSettings(false); }}} style={{ width: '100%', padding: 12, background: '#ff6b6b', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', marginBottom: 12 }}>🗑️ Clear All Data</button>
            <button onClick={() => setShowSettings(false)} style={{ width: '100%', padding: 12, background: 'transparent', color: '#888', border: '1px solid #333', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {showLeadDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }} onClick={() => setShowLeadDetail(null)}>
          <div style={{ background: '#1a1a2e', border: '2px solid #00d4aa', borderRadius: 16, padding: 32, maxWidth: 700, width: '100%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h2 style={{ color: '#00d4aa', marginBottom: 4 }}>{showLeadDetail.priority === 'hot' && '🔥 '}{showLeadDetail.businessName}</h2>
                <p style={{ color: '#888' }}>{showLeadDetail.contactName}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => tallyCall(showLeadDetail)} style={{ padding: '10px 16px', background: '#00d4aa', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit' }}>📞 Call</button>
                <button onClick={() => setShowLeadDetail(null)} style={{ padding: '10px 16px', background: '#333', color: '#888', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Phone', value: showLeadDetail.phone },
                { label: 'Email', value: showLeadDetail.email },
                { label: 'Website', value: showLeadDetail.website },
                { label: 'Industry', value: showLeadDetail.industry },
              ].map(f => (
                <div key={f.label} style={{ background: '#0a0a0f', padding: 12, borderRadius: 8 }}>
                  <div style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontSize: 14, wordBreak: 'break-all' }}>{f.value || '—'}</div>
                </div>
              ))}
              <div style={{ background: '#0a0a0f', padding: 12, borderRadius: 8, gridColumn: 'span 2' }}>
                <div style={{ color: '#888', fontSize: 11, marginBottom: 4 }}>Address</div>
                <div>{showLeadDetail.address || '—'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              <div style={{ background: '#0a0a0f', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ color: '#00d4aa', fontSize: 28, fontWeight: 'bold' }}>{showLeadDetail.callCount || 0}</div>
                <div style={{ color: '#888', fontSize: 11 }}>Calls</div>
              </div>
              <div style={{ background: '#0a0a0f', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ color: '#00a8ff', fontSize: 28, fontWeight: 'bold' }}>{showLeadDetail.emailCount || 0}</div>
                <div style={{ color: '#888', fontSize: 11 }}>Emails</div>
              </div>
              <div style={{ background: '#0a0a0f', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#888' }}>Last Called</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>{formatDate(showLeadDetail.lastCalled) || '—'}</div>
              </div>
              <div style={{ background: '#0a0a0f', padding: 16, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: isOverdue(showLeadDetail.followUp) ? '#ff6b6b' : '#888' }}>Follow Up</div>
                <div style={{ fontSize: 13, marginTop: 4, color: isOverdue(showLeadDetail.followUp) ? '#ff6b6b' : '#fff' }}>{formatDate(showLeadDetail.followUp) || '—'}</div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>Set Follow-up</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[1, 2, 3, 5, 7, 14, 30].map(d => (
                  <button key={d} onClick={() => setFollowUp(showLeadDetail, d)} style={{ padding: '8px 16px', background: '#0a0a0f', color: '#00d4aa', border: '1px solid #333', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>{d}d</button>
                ))}
                <button onClick={() => updateLead({ ...showLeadDetail, followUp: '' })} style={{ padding: '8px 16px', background: '#0a0a0f', color: '#888', border: '1px solid #333', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Clear</button>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>Notes</div>
              <textarea value={showLeadDetail.notes || ''} onChange={e => setShowLeadDetail({ ...showLeadDetail, notes: e.target.value })} onBlur={() => updateLead(showLeadDetail)} placeholder="Add notes..." style={{ width: '100%', padding: 12, background: '#0a0a0f', border: '1px solid #333', borderRadius: 8, color: '#e8e8e8', fontFamily: 'inherit', fontSize: 14, minHeight: 80, resize: 'vertical' }} />
            </div>

            {showLeadDetail.callHistory?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>Call History</div>
                <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                  {showLeadDetail.callHistory.slice().reverse().map((c, i) => (
                    <div key={i} style={{ padding: 10, background: '#0a0a0f', borderRadius: 6, marginBottom: 6, fontSize: 12 }}>
                      <span style={{ color: '#888' }}>{formatDateTime(c.timestamp)}</span>
                      {c.notes && <span style={{ marginLeft: 12 }}>{c.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1px solid #333' }}>
              <button onClick={() => { const l = showLeadDetail; setLeads(p => p.filter(x => x.id !== l.id)); setDncList(p => [...p, { ...l, dncDate: new Date().toISOString() }]); setShowLeadDetail(null); notify(`🚫 ${l.businessName} → DNC`); }} style={{ padding: '10px 20px', background: '#ff9f43', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit' }}>🚫 DNC</button>
              <button onClick={() => { const l = showLeadDetail; setLeads(p => p.filter(x => x.id !== l.id)); setDeadLeads(p => [...p, { ...l, deadDate: new Date().toISOString() }]); setShowLeadDetail(null); notify(`💀 ${l.businessName} → Dead`); }} style={{ padding: '10px 20px', background: '#ff6b6b', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit' }}>💀 Dead</button>
              <button onClick={() => { updateLead({ ...showLeadDetail, status: 'converted' }); notify('🎉 Converted!'); }} style={{ padding: '10px 20px', background: '#00d4aa', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit' }}>🎉 Convert</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #333' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 'bold', background: 'linear-gradient(90deg, #00d4aa, #00a8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>COLD CALL CRM</h1>
          <p style={{ color: '#666', fontSize: 11 }}>/ Help • I Import • E Export • S Settings • F Follow-ups • A Analytics • C Calls</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {followUps.length > 0 && (
            <button onClick={() => setView('followups')} style={{ padding: '10px 16px', background: overdueCount > 0 ? '#ff6b6b' : '#ffd700', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' }}>
              📅 {followUps.length} Due {overdueCount > 0 && `(${overdueCount} overdue)`}
            </button>
          )}
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#888' }}>TODAY</div>
            <div style={{ fontSize: 36, fontWeight: 'bold', color: '#00d4aa', lineHeight: 1 }}>{todaysCalls}</div>
          </div>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: `conic-gradient(${progress >= 100 ? '#ffd700' : '#00d4aa'} ${progress}%, #1a1a2e ${progress}%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 82, height: 82, borderRadius: '50%', background: '#0a0a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 'bold' }}>{Math.max(0, settings.dailyGoal - todaysCalls)}</div>
              <div style={{ fontSize: 9, color: '#888' }}>to go</div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div style={{ height: 6, background: '#1a1a2e', borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(progress, 100)}%`, height: '100%', background: progress >= 100 ? 'linear-gradient(90deg, #ffd700, #ff9f43)' : 'linear-gradient(90deg, #00d4aa, #00a8ff)', transition: 'width 0.3s' }} />
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'dashboard', label: '1 Dashboard' },
          { key: 'leads', label: '3 Leads', count: leads.length },
          { key: 'followups', label: 'F Follow-ups', count: followUps.length, alert: overdueCount > 0 },
          { key: 'dnc', label: '7 DNC', count: dncList.length },
          { key: 'dead', label: '9 Dead', count: deadLeads.length },
          { key: 'calllog', label: 'C Calls', count: callLog.length },
          { key: 'analytics', label: 'A Analytics' },
          { key: 'emails', label: '- Emails', count: emails.length },
        ].map(t => (
          <button key={t.key} onClick={() => { setView(t.key); setSelectedIndex(0); }} style={{ padding: '8px 14px', background: view === t.key ? 'linear-gradient(135deg, #00d4aa, #00a080)' : t.alert ? '#ff6b6b' : '#1a1a2e', color: view === t.key ? '#000' : t.alert ? '#000' : '#888', border: view === t.key ? 'none' : '1px solid #333', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: view === t.key || t.alert ? 'bold' : 'normal' }}>
            {t.label} {t.count !== undefined && `(${t.count})`}
          </button>
        ))}
        <button onClick={() => setView('addLead')} style={{ padding: '8px 14px', background: '#ffd700', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 'bold', marginLeft: 'auto' }}>+ Add Lead</button>
      </nav>

      {/* Search Indicator */}
      {searchQuery && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#ffd700', color: '#000', padding: '8px 24px', borderRadius: 20, fontWeight: 'bold', zIndex: 100 }}>
          🔍 {searchQuery}
        </div>
      )}

      {/* Main Content */}
      <main>
        {/* Dashboard */}
        {view === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 20, border: '1px solid #333' }}>
              <h3 style={{ color: '#00d4aa', marginBottom: 16, fontSize: 14 }}>📊 TODAY</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#888' }}>Calls</span><span style={{ color: '#00d4aa', fontWeight: 'bold', fontSize: 18 }}>{todaysCalls}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#888' }}>Goal</span><span style={{ fontWeight: 'bold', fontSize: 18 }}>{settings.dailyGoal}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#888' }}>Progress</span><span style={{ color: progress >= 100 ? '#ffd700' : '#00d4aa', fontWeight: 'bold', fontSize: 18 }}>{progress.toFixed(0)}%</span></div>
              </div>
            </div>

            <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 20, border: '1px solid #333' }}>
              <h3 style={{ color: '#ffd700', marginBottom: 16, fontSize: 14 }}>🎯 LEADS</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#888' }}>Active</span><span style={{ fontWeight: 'bold', fontSize: 18 }}>{leads.length}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#888' }}>Hot 🔥</span><span style={{ color: '#ff6b6b', fontWeight: 'bold', fontSize: 18 }}>{hotLeads}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#888' }}>Follow-ups</span><span style={{ color: followUps.length > 0 ? '#ffd700' : '#888', fontWeight: 'bold', fontSize: 18 }}>{followUps.length}</span></div>
              </div>
            </div>

            <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 20, border: '1px solid #333' }}>
              <h3 style={{ color: '#00a8ff', marginBottom: 16, fontSize: 14 }}>⚡ QUICK ACTIONS</h3>
              <button onClick={() => tallyCall()} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #00d4aa, #00a080)', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>📞 TALLY CALL (SPACE)</button>
              <button onClick={() => setView('addLead')} style={{ width: '100%', padding: 10, background: '#1a1a2e', color: '#ffd700', border: '1px solid #ffd700', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>+ NEW LEAD</button>
            </div>

            {/* Weekly Chart */}
            <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 20, border: '1px solid #333' }}>
              <h3 style={{ color: '#888', marginBottom: 16, fontSize: 14 }}>📈 LAST 7 DAYS</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
                {analytics.dailyBreakdown.map((d, i) => {
                  const max = Math.max(...analytics.dailyBreakdown.map(x => x.calls), 1);
                  const h = (d.calls / max) * 80;
                  return (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ height: h, background: i === 6 ? 'linear-gradient(180deg, #00d4aa, #00a080)' : '#333', borderRadius: '4px 4px 0 0', minHeight: 4, marginBottom: 4 }} />
                      <div style={{ fontSize: 10, color: i === 6 ? '#00d4aa' : '#666' }}>{d.date}</div>
                      <div style={{ fontSize: 11, color: i === 6 ? '#00d4aa' : '#888', fontWeight: 'bold' }}>{d.calls}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Follow-ups */}
            {followUps.length > 0 && (
              <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 20, border: overdueCount > 0 ? '1px solid #ff6b6b' : '1px solid #ffd700' }}>
                <h3 style={{ color: overdueCount > 0 ? '#ff6b6b' : '#ffd700', marginBottom: 16, fontSize: 14 }}>📅 FOLLOW-UPS DUE</h3>
                {followUps.slice(0, 4).map(l => (
                  <div key={l.id} onClick={() => setShowLeadDetail(l)} style={{ padding: 10, background: 'rgba(255,255,255,0.02)', borderRadius: 6, marginBottom: 8, cursor: 'pointer', borderLeft: isOverdue(l.followUp) ? '3px solid #ff6b6b' : '3px solid #ffd700' }}>
                    <div style={{ fontWeight: 'bold', fontSize: 13 }}>{l.businessName}</div>
                    <div style={{ color: isOverdue(l.followUp) ? '#ff6b6b' : '#888', fontSize: 11 }}>{formatDate(l.followUp)} {isOverdue(l.followUp) && '(OVERDUE)'}</div>
                  </div>
                ))}
                {followUps.length > 4 && <button onClick={() => setView('followups')} style={{ width: '100%', padding: 8, background: 'transparent', color: '#ffd700', border: '1px solid #333', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>View all {followUps.length} →</button>}
              </div>
            )}

            {/* Recent Leads */}
            <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 20, border: '1px solid #333' }}>
              <h3 style={{ color: '#888', marginBottom: 16, fontSize: 14 }}>📋 RECENT LEADS</h3>
              {leads.slice(0, 5).map((l, i) => (
                <div key={l.id} onClick={() => setShowLeadDetail(l)} style={{ padding: 10, background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderRadius: 6, marginBottom: 6, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 'bold', fontSize: 13 }}>{l.priority === 'hot' && '🔥 '}{l.businessName}</span>
                    <span style={{ color: '#888', fontSize: 11 }}>{l.callCount || 0} calls</span>
                  </div>
                  <div style={{ color: '#666', fontSize: 11 }}>{l.phone}</div>
                </div>
              ))}
              {leads.length === 0 && <p style={{ color: '#666', textAlign: 'center', padding: 20, fontSize: 13 }}>No leads yet. Press + to add!</p>}
            </div>
          </div>
        )}

        {/* Analytics */}
        {view === 'analytics' && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {['week', 'month', 'all'].map(r => (
                <button key={r} onClick={() => setAnalyticsRange(r)} style={{ padding: '8px 16px', background: analyticsRange === r ? '#00d4aa' : '#1a1a2e', color: analyticsRange === r ? '#000' : '#888', border: '1px solid #333', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>{r === 'week' ? '7 Days' : r === 'month' ? '30 Days' : 'All Time'}</button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              <div style={{ background: '#1a1a2e', padding: 24, borderRadius: 12, textAlign: 'center' }}><div style={{ color: '#00d4aa', fontSize: 42, fontWeight: 'bold' }}>{analytics.totalCalls}</div><div style={{ color: '#888', fontSize: 13 }}>Total Calls</div></div>
              <div style={{ background: '#1a1a2e', padding: 24, borderRadius: 12, textAlign: 'center' }}><div style={{ color: '#00a8ff', fontSize: 42, fontWeight: 'bold' }}>{analytics.avgPerDay}</div><div style={{ color: '#888', fontSize: 13 }}>Avg/Day</div></div>
              <div style={{ background: '#1a1a2e', padding: 24, borderRadius: 12, textAlign: 'center' }}><div style={{ color: '#ffd700', fontSize: 42, fontWeight: 'bold' }}>{analytics.leadsContacted}</div><div style={{ color: '#888', fontSize: 13 }}>Leads Contacted</div></div>
              <div style={{ background: '#1a1a2e', padding: 24, borderRadius: 12, textAlign: 'center' }}><div style={{ color: '#ff6b6b', fontSize: 42, fontWeight: 'bold' }}>{analytics.maxDay.count}</div><div style={{ color: '#888', fontSize: 13 }}>Best Day</div></div>
            </div>

            {Object.keys(analytics.outcomes).length > 0 && (
              <div style={{ background: '#1a1a2e', padding: 24, borderRadius: 12 }}>
                <h3 style={{ color: '#888', marginBottom: 16, fontSize: 14 }}>OUTCOMES</h3>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {Object.entries(analytics.outcomes).map(([k, v]) => (
                    <div key={k} style={{ padding: '12px 20px', background: '#0a0a0f', borderRadius: 8 }}>
                      <span style={{ fontSize: 20, fontWeight: 'bold', color: '#00d4aa', marginRight: 10 }}>{v}</span>
                      <span style={{ color: '#888', textTransform: 'capitalize' }}>{k}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ background: '#1a1a2e', padding: 24, borderRadius: 12 }}>
              <h3 style={{ color: '#888', marginBottom: 20, fontSize: 14 }}>DAILY BREAKDOWN</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 150 }}>
                {analytics.dailyBreakdown.map((d, i) => {
                  const max = Math.max(...analytics.dailyBreakdown.map(x => x.calls), 1);
                  const h = (d.calls / max) * 120;
                  return (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: 14, color: '#00d4aa', marginBottom: 4, fontWeight: 'bold' }}>{d.calls}</div>
                      <div style={{ height: h, background: i === 6 ? 'linear-gradient(180deg, #00d4aa, #00a080)' : 'linear-gradient(180deg, #333, #222)', borderRadius: '6px 6px 0 0', minHeight: 4 }} />
                      <div style={{ fontSize: 12, color: i === 6 ? '#00d4aa' : '#666', marginTop: 8 }}>{d.date}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* List Views */}
        {['leads', 'followups', 'dnc', 'dead', 'calllog'].includes(view) && (
          <div style={{ background: '#1a1a2e', borderRadius: 12, border: '1px solid #333', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 16, color: '#00d4aa' }}>
                {view === 'leads' && '🎯 Active Leads'}
                {view === 'followups' && '📅 Follow-ups Due'}
                {view === 'dnc' && '🚫 Do Not Call'}
                {view === 'dead' && '💀 Dead Leads'}
                {view === 'calllog' && '📞 Call Log'}
              </h2>
              <span style={{ color: '#666', fontSize: 12 }}>{getCurrentList().length} entries</span>
            </div>
            
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {getCurrentList().map((item, idx) => (
                <div key={item.id} onClick={() => { setSelectedIndex(idx); if (view !== 'calllog') setShowLeadDetail(item); }} style={{ padding: '14px 20px', background: idx === selectedIndex ? 'linear-gradient(90deg, rgba(0,212,170,0.15), transparent)' : 'transparent', borderLeft: idx === selectedIndex ? '3px solid #00d4aa' : '3px solid transparent', borderBottom: '1px solid #1a1a2e', cursor: 'pointer' }}>
                  {view === 'calllog' ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div><div style={{ fontWeight: 'bold', fontSize: 14 }}>{item.leadName}</div><div style={{ color: '#888', fontSize: 12 }}>{item.phone}</div></div>
                      <div style={{ textAlign: 'right' }}><div style={{ color: '#00d4aa', fontSize: 12 }}>{item.outcome}</div><div style={{ color: '#666', fontSize: 11 }}>{formatDateTime(item.timestamp)}</div></div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 2 }}>
                          {item.priority === 'hot' && <span style={{ color: '#ff6b6b' }}>🔥 </span>}
                          {item.businessName}
                          {item.status === 'converted' && <span style={{ color: '#00d4aa', marginLeft: 8 }}>✓ Converted</span>}
                        </div>
                        <div style={{ color: '#888', fontSize: 12 }}>
                          {item.contactName && <span>{item.contactName} • </span>}{item.phone}
                          {item.industry && <span style={{ color: '#666' }}> • {item.industry}</span>}
                        </div>
                        {item.notes && <div style={{ color: '#555', fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>{item.notes.substring(0, 60)}...</div>}
                      </div>
                      <div style={{ textAlign: 'right', marginLeft: 16 }}>
                        {['leads', 'followups'].includes(view) && (
                          <>
                            <div style={{ color: '#00d4aa', fontSize: 13, fontWeight: 'bold' }}>{item.callCount || 0} calls</div>
                            {item.followUp && <div style={{ color: isOverdue(item.followUp) ? '#ff6b6b' : '#666', fontSize: 11, marginTop: 2 }}>📅 {formatDate(item.followUp)}</div>}
                          </>
                        )}
                        {view === 'dnc' && <div style={{ color: '#ff9f43', fontSize: 11 }}>{formatDate(item.dncDate)}</div>}
                        {view === 'dead' && <div style={{ color: '#ff6b6b', fontSize: 11 }}>{formatDate(item.deadDate)}</div>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {getCurrentList().length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>{searchQuery ? `No results for "${searchQuery}"` : 'No entries'}</div>}
            </div>
          </div>
        )}

        {/* Emails */}
        {view === 'emails' && (
          <div style={{ background: '#1a1a2e', borderRadius: 12, border: '1px solid #333', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 16, color: '#00a8ff' }}>📧 Email Log</h2>
              <button onClick={() => setView('addEmail')} style={{ padding: '6px 14px', background: '#00a8ff', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', fontSize: 12 }}>* Compose</button>
            </div>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {emails.map((e, idx) => (
                <div key={e.id} onClick={() => setSelectedIndex(idx)} style={{ padding: '14px 20px', background: idx === selectedIndex ? 'linear-gradient(90deg, rgba(0,168,255,0.15), transparent)' : 'transparent', borderLeft: idx === selectedIndex ? '3px solid #00a8ff' : '3px solid transparent', borderBottom: '1px solid #1a1a2e', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div><div style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 14 }}>{e.subject}</div><div style={{ color: '#888', fontSize: 12 }}>To: {e.to}</div></div>
                    <div style={{ color: '#666', fontSize: 11 }}>{formatDateTime(e.sentAt)}</div>
                  </div>
                  <div style={{ color: '#555', fontSize: 12, marginTop: 6 }}>{e.body.substring(0, 80)}...</div>
                </div>
              ))}
              {emails.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>No emails. Press * to compose.</div>}
            </div>
          </div>
        )}

        {/* Add Lead Form */}
        {view === 'addLead' && (
          <div style={{ background: '#1a1a2e', borderRadius: 12, border: '1px solid #ffd700', padding: 28, maxWidth: 700, margin: '0 auto' }}>
            <h2 style={{ color: '#ffd700', marginBottom: 20, fontSize: 18 }}>➕ Add New Lead</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', color: '#888', marginBottom: 4, fontSize: 12 }}>Business Name *</label><input className="form-input" value={formData.businessName} onChange={e => setFormData(p => ({ ...p, businessName: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0f', border: '1px solid #333', borderRadius: 6, color: '#e8e8e8', fontFamily: 'inherit', fontSize: 14 }} /></div>
              <div><label style={{ display: 'block', color: '#888', marginBottom: 4, fontSize: 12 }}>Contact Name</label><input className="form-input" value={formData.contactName} onChange={e => setFormData(p => ({ ...p, contactName: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0f', border: '1px solid #333', borderRadius: 6, color: '#e8e8e8', fontFamily: 'inherit', fontSize: 14 }} /></div>
              <div><label style={{ display: 'block', color: '#888', marginBottom: 4, fontSize: 12 }}>Phone *</label><input className="form-input" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0f', border: '1px solid #333', borderRadius: 6, color: '#e8e8e8', fontFamily: 'inherit', fontSize: 14 }} /></div>
              <div><label style={{ display: 'block', color: '#888', marginBottom: 4, fontSize: 12 }}>Email</label><input className="form-input" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0f', border: '1px solid #333', borderRadius: 6, color: '#e8e8e8', fontFamily: 'inherit', fontSize: 14 }} /></div>
              <div><label style={{ display: 'block', color: '#888', marginBottom: 4, fontSize: 12 }}>Website</label><input className="form-input" value={formData.website} onChange={e => setFormData(p => ({ ...p, website: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0f', border: '1px solid #333', borderRadius: 6, color: '#e8e8e8', fontFamily: 'inherit', fontSize: 14 }} /></div>
              <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', color: '#888', marginBottom: 4, fontSize: 12 }}>Address</label><input className="form-input" value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0f', border: '1px solid #333', borderRadius: 6, color: '#e8e8e8', fontFamily: 'inherit', fontSize: 14 }} /></div>
              <div><label style={{ display: 'block', color: '#888', marginBottom: 4, fontSize: 12 }}>Industry</label><input className="form-input" value={formData.industry} onChange={e => setFormData(p => ({ ...p, industry: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0f', border: '1px solid #333', borderRadius: 6, color: '#e8e8e8', fontFamily: 'inherit', fontSize: 14 }} /></div>
              <div><label style={{ display: 'block', color: '#888', marginBottom: 4, fontSize: 12 }}>Source</label><input className="form-input" value={formData.source} onChange={e => setFormData(p => ({ ...p, source: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0f', border: '1px solid #333', borderRadius: 6, color: '#e8e8e8', fontFamily: 'inherit', fontSize: 14 }} /></div>
              <div><label style={{ display: 'block', color: '#888', marginBottom: 4, fontSize: 12 }}>Priority</label><select value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0f', border: '1px solid #333', borderRadius: 6, color: '#e8e8e8', fontFamily: 'inherit', fontSize: 14 }}><option value="normal">Normal</option><option value="hot">🔥 Hot</option><option value="low">Low</option></select></div>
              <div><label style={{ display: 'block', color: '#888', marginBottom: 4, fontSize: 12 }}>Follow-up</label><input type="date" value={formData.followUp} onChange={e => setFormData(p => ({ ...p, followUp: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0f', border: '1px solid #333', borderRadius: 6, color: '#e8e8e8', fontFamily: 'inherit', fontSize: 14 }} /></div>
              <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', color: '#888', marginBottom: 4, fontSize: 12 }}>Notes</label><textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0f', border: '1px solid #333', borderRadius: 6, color: '#e8e8e8', fontFamily: 'inherit', fontSize: 14, resize: 'vertical' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={submitLead} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg, #00d4aa, #00a080)', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 'bold' }}>Save Lead</button>
              <button onClick={() => setView('dashboard')} style={{ padding: '12px 20px', background: 'transparent', color: '#888', border: '1px solid #333', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Add Email Form */}
        {view === 'addEmail' && (
          <div style={{ background: '#1a1a2e', borderRadius: 12, border: '1px solid #00a8ff', padding: 28, maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ color: '#00a8ff', marginBottom: 20, fontSize: 18 }}>📧 Log Email</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              <div><label style={{ display: 'block', color: '#888', marginBottom: 4, fontSize: 12 }}>To *</label><input className="form-input" type="email" value={emailForm.to} onChange={e => setEmailForm(p => ({ ...p, to: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0f', border: '1px solid #333', borderRadius: 6, color: '#e8e8e8', fontFamily: 'inherit', fontSize: 14 }} /></div>
              <div><label style={{ display: 'block', color: '#888', marginBottom: 4, fontSize: 12 }}>Subject *</label><input className="form-input" value={emailForm.subject} onChange={e => setEmailForm(p => ({ ...p, subject: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0f', border: '1px solid #333', borderRadius: 6, color: '#e8e8e8', fontFamily: 'inherit', fontSize: 14 }} /></div>
              <div><label style={{ display: 'block', color: '#888', marginBottom: 4, fontSize: 12 }}>Body</label><textarea value={emailForm.body} onChange={e => setEmailForm(p => ({ ...p, body: e.target.value }))} rows={6} style={{ width: '100%', padding: '10px 14px', background: '#0a0a0f', border: '1px solid #333', borderRadius: 6, color: '#e8e8e8', fontFamily: 'inherit', fontSize: 14, resize: 'vertical' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={submitEmail} style={{ flex: 1, padding: 12, background: 'linear-gradient(135deg, #00a8ff, #0080cc)', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 'bold' }}>Save Email</button>
              <button onClick={() => setView('dashboard')} style={{ padding: '12px 20px', background: 'transparent', color: '#888', border: '1px solid #333', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>Cancel</button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #222', display: 'flex', justifyContent: 'space-between', color: '#555', fontSize: 11 }}>
        <span>/ Help • F Follow-ups • A Analytics • C Calls • I Import • E Export • S Settings</span>
        <span>Data saved locally</span>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0a0a0f; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }
      `}</style>
    </div>
  );
}