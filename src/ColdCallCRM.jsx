import React, { useState, useEffect, useCallback, useMemo } from 'react';

// ============================================================================
// STORAGE & UTILITIES
// ============================================================================
const STORAGE_KEYS = {
  leads: 'crm_leads',
  dnc: 'crm_dnc',
  dead: 'crm_dead',
  trash: 'crm_trash',
  stats: 'crm_stats',
  emails: 'crm_emails',
  callLog: 'crm_call_log',
  settings: 'crm_settings',
  golfCourses: 'crm_golf_courses'
};

const loadData = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) { return defaultValue; }
};

const saveData = (key, data) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* Ignore storage errors */ }
};

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString() : '';
const formatDateTime = (dateStr) => dateStr ? new Date(dateStr).toLocaleString() : '';
const formatDateForInput = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
};

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

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function ColdCallCRM() {
  // Core data state
  const [leads, setLeads] = useState(() => loadData(STORAGE_KEYS.leads, []));
  const [dncList, setDncList] = useState(() => loadData(STORAGE_KEYS.dnc, []));
  const [deadLeads, setDeadLeads] = useState(() => loadData(STORAGE_KEYS.dead, []));
  const [trash, setTrash] = useState(() => loadData(STORAGE_KEYS.trash, []));
  const [emails, setEmails] = useState(() => loadData(STORAGE_KEYS.emails, []));
  const [callLog, setCallLog] = useState(() => loadData(STORAGE_KEYS.callLog, []));
  const [dailyStats, setDailyStats] = useState(() => loadData(STORAGE_KEYS.stats, {}));
  const [golfCourses, setGolfCourses] = useState(() => loadData(STORAGE_KEYS.golfCourses, []));
  const [settings, setSettings] = useState(() => loadData(STORAGE_KEYS.settings, { 
    dailyGoal: 200, 
    defaultFollowUpDays: 3,
    activeGolfCourse: null 
  }));
  
  // UI state
  const [view, setView] = useState('dashboard');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [notification, setNotification] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [analyticsRange, setAnalyticsRange] = useState('week');
  
  // Edit state
  const [editingLead, setEditingLead] = useState(null);
  const [editingCall, setEditingCall] = useState(null);
  const [editingGolfCourse, setEditingGolfCourse] = useState(null);
  const [showLeadDetail, setShowLeadDetail] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    businessName: '', contactName: '', phone: '', email: '', 
    address: '', website: '', industry: '', notes: '', 
    priority: 'normal', source: '', followUp: '', callDate: '',
    golfCourseId: ''
  });
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '', leadId: '' });
  const [importData, setImportData] = useState('');
  const [golfCourseForm, setGolfCourseForm] = useState({
    name: '', address: '', phone: '', contactName: '', email: '', notes: '', region: ''
  });

  // Today's calls
  const todayKey = new Date().toDateString();
  const todaysCalls = dailyStats[todayKey] || 0;

  // Get active golf course
  const activeGolfCourse = useMemo(() => {
    return golfCourses.find(gc => gc.id === settings.activeGolfCourse) || null;
  }, [golfCourses, settings.activeGolfCourse]);

  // Persist data
  useEffect(() => { saveData(STORAGE_KEYS.leads, leads); }, [leads]);
  useEffect(() => { saveData(STORAGE_KEYS.dnc, dncList); }, [dncList]);
  useEffect(() => { saveData(STORAGE_KEYS.dead, deadLeads); }, [deadLeads]);
  useEffect(() => { saveData(STORAGE_KEYS.trash, trash); }, [trash]);
  useEffect(() => { saveData(STORAGE_KEYS.emails, emails); }, [emails]);
  useEffect(() => { saveData(STORAGE_KEYS.callLog, callLog); }, [callLog]);
  useEffect(() => { saveData(STORAGE_KEYS.stats, dailyStats); }, [dailyStats]);
  useEffect(() => { saveData(STORAGE_KEYS.golfCourses, golfCourses); }, [golfCourses]);
  useEffect(() => { saveData(STORAGE_KEYS.settings, settings); }, [settings]);

  // Notification helper
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
      callDate: now,
      leadId: lead?.id || null,
      leadName: lead?.businessName || 'Manual Tally',
      phone: lead?.phone || '',
      outcome,
      notes,
      golfCourseId: settings.activeGolfCourse
    };
    setCallLog(prev => [callEntry, ...prev.slice(0, 999)]);
    
    if (lead) {
      setLeads(prev => prev.map(l => 
        l.id === lead.id 
          ? { ...l, lastCalled: now, callCount: (l.callCount || 0) + 1,
              callHistory: [...(l.callHistory || []), { id: generateId(), timestamp: now, outcome, notes }] }
          : l
      ));
    }
    
    notify(`📞 Call tallied! Today: ${(dailyStats[today] || 0) + 1}`);
  }, [dailyStats, notify, settings.activeGolfCourse]);

  // Delete call from log (with undo)
  const deleteCall = useCallback((callId) => {
    const call = callLog.find(c => c.id === callId);
    if (!call) return;
    
    // Move to trash
    setTrash(prev => [...prev, { ...call, type: 'call', deletedAt: new Date().toISOString() }]);
    setCallLog(prev => prev.filter(c => c.id !== callId));
    
    // Update daily stats
    const callDate = new Date(call.timestamp).toDateString();
    setDailyStats(prev => ({ ...prev, [callDate]: Math.max(0, (prev[callDate] || 1) - 1) }));
    
    // Update lead if linked
    if (call.leadId) {
      setLeads(prev => prev.map(l => 
        l.id === call.leadId 
          ? { ...l, callCount: Math.max(0, (l.callCount || 1) - 1),
              callHistory: (l.callHistory || []).filter(h => h.id !== callId) }
          : l
      ));
    }
    
    notify('🗑️ Call deleted (check Trash to restore)');
  }, [callLog, notify]);

  // Restore from trash
  const restoreFromTrash = useCallback((item) => {
    if (item.type === 'call') {
      setCallLog(prev => [item, ...prev]);
      const callDate = new Date(item.timestamp).toDateString();
      setDailyStats(prev => ({ ...prev, [callDate]: (prev[callDate] || 0) + 1 }));
      if (item.leadId) {
        setLeads(prev => prev.map(l => 
          l.id === item.leadId 
            ? { ...l, callCount: (l.callCount || 0) + 1,
                callHistory: [...(l.callHistory || []), { id: item.id, timestamp: item.timestamp, outcome: item.outcome, notes: item.notes }] }
            : l
        ));
      }
    } else if (item.type === 'lead') {
      setLeads(prev => [...prev, item]);
    } else if (item.type === 'dnc') {
      setDncList(prev => [...prev, item]);
    } else if (item.type === 'dead') {
      setDeadLeads(prev => [...prev, item]);
    }
    
    setTrash(prev => prev.filter(t => t.id !== item.id || t.type !== item.type));
    notify('✅ Restored from trash');
  }, [notify]);

  // Empty trash
  const emptyTrash = useCallback(() => {
    if (trash.length === 0) return;
    if (confirm(`Permanently delete ${trash.length} items? This cannot be undone.`)) {
      setTrash([]);
      notify('🗑️ Trash emptied');
    }
  }, [trash, notify]);

  // Update lead
  const updateLead = useCallback((updatedLead) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    setShowLeadDetail(updatedLead);
    setEditingLead(null);
    notify('✅ Lead updated');
  }, [notify]);

  // Delete lead to trash
  const deleteLeadToTrash = useCallback((lead, listType = 'lead') => {
    if (listType === 'lead') {
      setLeads(prev => prev.filter(l => l.id !== lead.id));
    } else if (listType === 'dnc') {
      setDncList(prev => prev.filter(l => l.id !== lead.id));
    } else if (listType === 'dead') {
      setDeadLeads(prev => prev.filter(l => l.id !== lead.id));
    }
    setTrash(prev => [...prev, { ...lead, type: listType, deletedAt: new Date().toISOString() }]);
    setShowLeadDetail(null);
    notify('🗑️ Moved to trash');
  }, [notify]);

  // Update call
  const updateCall = useCallback((updatedCall) => {
    setCallLog(prev => prev.map(c => c.id === updatedCall.id ? updatedCall : c));
    if (updatedCall.leadId) {
      setLeads(prev => prev.map(l => 
        l.id === updatedCall.leadId 
          ? { ...l, callHistory: (l.callHistory || []).map(h => h.id === updatedCall.id ? { ...h, ...updatedCall } : h) }
          : l
      ));
    }
    setEditingCall(null);
    notify('✅ Call updated');
  }, [notify]);

  // Golf course management
  const addGolfCourse = useCallback(() => {
    if (!golfCourseForm.name) { notify('❌ Course name required'); return; }
    const newCourse = { id: generateId(), ...golfCourseForm, createdAt: new Date().toISOString() };
    setGolfCourses(prev => [...prev, newCourse]);
    setGolfCourseForm({ name: '', address: '', phone: '', contactName: '', email: '', notes: '', region: '' });
    notify('⛳ Golf course added');
  }, [golfCourseForm, notify]);

  const updateGolfCourse = useCallback(() => {
    if (!editingGolfCourse) return;
    setGolfCourses(prev => prev.map(gc => gc.id === editingGolfCourse.id ? editingGolfCourse : gc));
    setEditingGolfCourse(null);
    notify('✅ Golf course updated');
  }, [editingGolfCourse, notify]);

  const deleteGolfCourse = useCallback((courseId) => {
    if (confirm('Delete this golf course? Leads will keep their association but the course record will be removed.')) {
      setGolfCourses(prev => prev.filter(gc => gc.id !== courseId));
      if (settings.activeGolfCourse === courseId) {
        setSettings(prev => ({ ...prev, activeGolfCourse: null }));
      }
      notify('🗑️ Golf course deleted');
    }
  }, [settings.activeGolfCourse, notify]);

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

  // Export functions
  const exportToCSV = useCallback((dataType) => {
    let data, filename, headers;
    
    if (dataType === 'all') {
      const allData = { leads, dncList, deadLeads, emails, callLog, dailyStats, golfCourses, settings, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'crm_backup.json'; a.click();
      notify('📦 Full backup exported!');
      return;
    }
    
    const courseNameById = (id) => golfCourses.find(gc => gc.id === id)?.name || '';
    
    switch(dataType) {
      case 'leads':
        headers = ['Business Name', 'Contact', 'Phone', 'Email', 'Address', 'Website', 'Industry', 'Priority', 'Source', 'Notes', 'Calls', 'Last Called', 'Follow Up', 'Call Date', 'Golf Course'];
        data = leads.map(l => [l.businessName, l.contactName, l.phone, l.email, l.address, l.website, l.industry, l.priority, l.source, l.notes, l.callCount || 0, formatDateTime(l.lastCalled), formatDate(l.followUp), formatDate(l.callDate), courseNameById(l.golfCourseId)]);
        filename = 'leads.csv';
        break;
      case 'dnc':
        headers = ['Business Name', 'Contact', 'Phone', 'Email', 'DNC Date', 'Golf Course'];
        data = dncList.map(l => [l.businessName, l.contactName, l.phone, l.email, formatDateTime(l.dncDate), courseNameById(l.golfCourseId)]);
        filename = 'dnc_list.csv';
        break;
      case 'dead':
        headers = ['Business Name', 'Contact', 'Phone', 'Email', 'Dead Date', 'Golf Course'];
        data = deadLeads.map(l => [l.businessName, l.contactName, l.phone, l.email, formatDateTime(l.deadDate), courseNameById(l.golfCourseId)]);
        filename = 'dead_leads.csv';
        break;
      case 'calls':
        headers = ['Timestamp', 'Call Date', 'Lead', 'Phone', 'Outcome', 'Notes', 'Golf Course'];
        data = callLog.map(c => [formatDateTime(c.timestamp), formatDate(c.callDate), c.leadName, c.phone, c.outcome, c.notes, courseNameById(c.golfCourseId)]);
        filename = 'call_log.csv';
        break;
      case 'golfcourses':
        headers = ['Name', 'Address', 'Phone', 'Contact', 'Email', 'Region', 'Notes'];
        data = golfCourses.map(gc => [gc.name, gc.address, gc.phone, gc.contactName, gc.email, gc.region, gc.notes]);
        filename = 'golf_courses.csv';
        break;
      default: return;
    }

    const csv = [headers, ...data].map(row => row.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    notify(`📊 ${dataType} exported!`);
    setShowExportModal(false);
  }, [leads, dncList, deadLeads, callLog, emails, dailyStats, golfCourses, settings, notify]);

  // Import
  const importFromCSV = useCallback(() => {
    // Try JSON first
    let isJson = false;
    try {
      const json = JSON.parse(importData);
      if (json.leads || json.dncList || json.deadLeads || json.callLog || json.golfCourses) {
        isJson = true;
        if (json.leads) setLeads(prev => [...prev, ...json.leads.map(l => ({ ...l, id: generateId() }))]);
        if (json.dncList) setDncList(prev => [...prev, ...json.dncList]);
        if (json.deadLeads) setDeadLeads(prev => [...prev, ...json.deadLeads]);
        if (json.callLog) setCallLog(prev => [...prev, ...json.callLog]);
        if (json.golfCourses) setGolfCourses(prev => [...prev, ...json.golfCourses.map(gc => ({ ...gc, id: generateId() }))]);
        notify('✅ JSON backup imported!');
        setShowImportModal(false); 
        setImportData('');
      }
    } catch (e) {
      // Not valid JSON, will try CSV below
    }

    if (isJson) return;

    // Try CSV
    try {
      const lines = importData.trim().split('\n');
      if (lines.length < 2) {
        notify('❌ Import failed - no data rows');
        return;
      }
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
          else if (h.includes('address')) lead.address = v;
          else if (h.includes('website')) lead.website = v;
          else if (h.includes('industry')) lead.industry = v;
          else if (h.includes('source')) lead.source = v;
          else if (h.includes('note')) lead.notes = v;
          else if (h.includes('priority')) lead.priority = v || 'normal';
        });
        return lead;
      }).filter(l => l.businessName || l.phone);

      if (newLeads.length === 0) {
        notify('❌ No valid leads found in CSV');
        return;
      }

      setLeads(prev => [...prev, ...newLeads]);
      notify(`✅ Imported ${newLeads.length} leads!`);
      setShowImportModal(false); 
      setImportData('');
    } catch (e) { 
      notify('❌ Import failed'); 
    }
  }, [importData, notify, settings.activeGolfCourse]);

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
      case 'trash': return trash;
      case 'golfcourses': return golfCourses;
      default: return [];
    }
  }, [view, leads, followUps, dncList, deadLeads, emails, callLog, trash, golfCourses, searchQuery]);

  // Set follow-up
  const setFollowUp = useCallback((lead, days) => {
    const d = new Date(); d.setDate(d.getDate() + days);
    updateLead({ ...lead, followUp: d.toISOString().split('T')[0] });
  }, [updateLead]);

  // Submit handlers
  const submitLead = useCallback(() => {
    if (!formData.businessName && !formData.phone) { notify('❌ Name or phone required'); return; }
    const newLead = { 
      id: generateId(), 
      ...formData, 
      createdAt: new Date().toISOString(), 
      callCount: 0, 
      callHistory: [],
      golfCourseId: formData.golfCourseId || settings.activeGolfCourse
    };
    setLeads(prev => [newLead, ...prev]);
    notify(`✅ ${formData.businessName || 'Lead'} added!`);
    setView('leads'); 
    setSelectedIndex(0);
    setFormData({ businessName: '', contactName: '', phone: '', email: '', address: '', website: '', industry: '', notes: '', priority: 'normal', source: '', followUp: '', callDate: '', golfCourseId: '' });
  }, [formData, notify, settings.activeGolfCourse]);

  const submitEmail = useCallback(() => {
    if (!emailForm.to || !emailForm.subject) { notify('❌ To and subject required'); return; }
    setEmails(prev => [{ id: generateId(), ...emailForm, sentAt: new Date().toISOString(), status: 'logged' }, ...prev]);
    if (emailForm.leadId) {
      setLeads(prev => prev.map(l => l.id === emailForm.leadId ? { ...l, lastEmailed: new Date().toISOString(), emailCount: (l.emailCount || 0) + 1 } : l));
    }
    notify(`📧 Email logged!`);
    setView('emails'); 
    setSelectedIndex(0);
  }, [emailForm, notify]);

  const progress = Math.min(100, (todaysCalls / settings.dailyGoal) * 100);
  const hotLeads = leads.filter(l => l.priority === 'hot').length;

  // ============================================================================
  // KEYBOARD HANDLER
  // ============================================================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if in input or modal open
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        if (e.key === 'Escape') {
          e.target.blur();
          if (['addLead', 'addEmail', 'addGolfCourse'].includes(view)) setView('dashboard');
          setShowImportModal(false); setShowExportModal(false); setShowSettings(false); 
          setShowLeadDetail(null); setEditingLead(null); setEditingCall(null); setEditingGolfCourse(null);
          setShowPrivacy(false); setShowTerms(false);
        }
        return;
      }

      if (e.key === 'Escape') {
        setShowHelp(false); setSearchQuery(''); setShowImportModal(false); setShowExportModal(false); 
        setShowSettings(false); setShowLeadDetail(null); setEditingLead(null); setEditingCall(null);
        setEditingGolfCourse(null); setShowPrivacy(false); setShowTerms(false);
        if (['addLead', 'addEmail', 'addGolfCourse'].includes(view)) setView('dashboard');
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
          if (['leads', 'followups', 'dnc', 'dead', 'emails', 'calllog', 'trash', 'golfcourses'].includes(view)) {
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
          } else if (view === 'golfcourses' && list[selectedIndex]) {
            setEditingGolfCourse(list[selectedIndex]);
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
          if (['leads', 'followups', 'dnc', 'dead', 'emails', 'calllog', 'trash', 'golfcourses'].includes(view)) {
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
          setFormData({ businessName: '', contactName: '', phone: '', email: '', address: '', website: '', industry: '', notes: '', priority: 'normal', source: '', followUp: '', callDate: '', golfCourseId: settings.activeGolfCourse || '' });
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
          } else if (view === 'trash' && list[selectedIndex]) {
            restoreFromTrash(list[selectedIndex]);
            setSelectedIndex(prev => Math.max(0, prev - 1));
          } else if (['leads', 'followups'].includes(view) && list[selectedIndex]) {
            setShowLeadDetail(list[selectedIndex]);
          } else if (view === 'calllog' && list[selectedIndex]) {
            setEditingCall(list[selectedIndex]);
          }
          break;
          
        case 'delete':
        case '.':
          e.preventDefault();
          if (view === 'dnc' && list[selectedIndex]) {
            deleteLeadToTrash(list[selectedIndex], 'dnc');
            setSelectedIndex(prev => Math.max(0, prev - 1));
          } else if (view === 'dead' && list[selectedIndex]) {
            deleteLeadToTrash(list[selectedIndex], 'dead');
            setSelectedIndex(prev => Math.max(0, prev - 1));
          } else if (view === 'leads' && list[selectedIndex]) {
            deleteLeadToTrash(list[selectedIndex], 'lead');
            setSelectedIndex(prev => Math.max(0, prev - 1));
          } else if (view === 'calllog' && list[selectedIndex]) {
            deleteCall(list[selectedIndex].id);
            setSelectedIndex(prev => Math.max(0, prev - 1));
          } else if (view === 'emails' && list[selectedIndex]) {
            setEmails(prev => prev.filter(x => x.id !== list[selectedIndex].id));
            notify('Deleted'); setSelectedIndex(prev => Math.max(0, prev - 1));
          }
          break;

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

        case 't':
          e.preventDefault();
          setView('trash'); setSelectedIndex(0);
          break;

        case 'g':
          e.preventDefault();
          setView('golfcourses'); setSelectedIndex(0);
          break;
          
        default:
          if (e.key.length === 1 && e.key.match(/[h-oq-ru-z]/i) && ['leads', 'followups', 'dnc', 'dead'].includes(view)) {
            setSearchQuery(prev => prev + e.key);
            setSelectedIndex(0);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, selectedIndex, tallyCall, getCurrentList, notify, restoreFromTrash, deleteLeadToTrash, deleteCall, settings.activeGolfCourse]);

  // Clear search
  useEffect(() => {
    if (searchQuery) {
      const t = setTimeout(() => setSearchQuery(''), 1500);
      return () => clearTimeout(t);
    }
  }, [searchQuery]);

  // Form focus
  useEffect(() => {
    if (['addLead', 'addEmail', 'addGolfCourse'].includes(view)) {
      setTimeout(() => {
        const inputs = document.querySelectorAll('.form-input');
        if (inputs[0]) inputs[0].focus();
      }, 50);
    }
  }, [view]);

  // ============================================================================
  // STYLES - Modern, eye-friendly design
  // ============================================================================
  const colors = {
    bg: '#1a1b1e',
    bgLight: '#25262b',
    bgCard: '#2c2e33',
    border: '#373a40',
    text: '#c1c2c5',
    textMuted: '#909296',
    textDim: '#5c5f66',
    primary: '#4dabf7',
    primaryDark: '#339af0',
    success: '#69db7c',
    successDark: '#51cf66',
    warning: '#ffd43b',
    warningDark: '#fab005',
    danger: '#ff8787',
    dangerDark: '#fa5252',
    accent: '#9775fa',
  };

  const buttonBase = {
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '13px',
    fontWeight: '500',
    border: 'none',
    transition: 'all 0.2s ease'
  };

  const inputBase = {
    width: '100%',
    padding: '10px 14px',
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    color: colors.text,
    fontFamily: 'inherit',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease'
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: colors.bg, 
      color: colors.text, 
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      WebkitFontSmoothing: 'antialiased'
    }}>
      
      {/* Notification */}
      {notification && (
        <div style={{ 
          position: 'fixed', top: 20, right: 20, 
          background: colors.bgCard, 
          color: colors.text,
          padding: '14px 20px', 
          borderRadius: '10px', 
          fontWeight: '500',
          fontSize: '14px',
          zIndex: 1000, 
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          border: `1px solid ${colors.border}`
        }}>
          {notification}
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)' }} onClick={() => setShowHelp(false)}>
          <div style={{ background: colors.bgLight, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '28px', maxWidth: 850, width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: colors.primary, marginBottom: 20, fontSize: '20px', fontWeight: '600' }}>⌨️ Keyboard Shortcuts</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
              <div>
                <h3 style={{ color: colors.warning, marginBottom: 12, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Navigation</h3>
                <div style={{ lineHeight: 2, fontSize: 13 }}>
                  <div><span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>1</span> Dashboard</div>
                  <div><span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>3</span> Leads</div>
                  <div><span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>7</span> DNC List</div>
                  <div><span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>9</span> Dead Leads</div>
                  <div><span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>F</span> Follow-ups</div>
                  <div><span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>C</span> Call Log</div>
                  <div><span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>G</span> Golf Courses</div>
                  <div><span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>T</span> Trash</div>
                  <div><span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>A</span> Analytics</div>
                </div>
              </div>
              <div>
                <h3 style={{ color: colors.warning, marginBottom: 12, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</h3>
                <div style={{ lineHeight: 2, fontSize: 13 }}>
                  <div><span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>SPACE</span> Tally Call</div>
                  <div><span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>5/Enter</span> View/Edit</div>
                  <div><span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>←</span> Mark DNC</div>
                  <div><span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>→</span> Mark Dead</div>
                  <div><span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>Del</span> Delete to Trash</div>
                  <div><span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>+</span> Add Lead</div>
                  <div><span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>*</span> Compose Email</div>
                </div>
              </div>
              <div>
                <h3 style={{ color: colors.warning, marginBottom: 12, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data</h3>
                <div style={{ lineHeight: 2, fontSize: 13 }}>
                  <div><span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>I</span> Import</div>
                  <div><span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>E</span> Export</div>
                  <div><span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>S</span> Settings</div>
                  <div><span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>/</span> Help</div>
                  <div><span style={{ color: colors.primary, fontFamily: 'monospace', background: colors.bg, padding: '2px 6px', borderRadius: 4 }}>Esc</span> Close</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)' }} onClick={() => setShowPrivacy(false)}>
          <div style={{ background: colors.bgLight, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '28px', maxWidth: 600, width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: colors.text, marginBottom: 8, fontSize: '22px', fontWeight: '600' }}>Privacy Policy</h2>
            <p style={{ color: colors.textMuted, fontSize: 12, marginBottom: 20 }}>Last updated: February 2026</p>
            
            <div style={{ display: 'grid', gap: 20 }}>
              <section>
                <h3 style={{ color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 8 }}>Data Collection</h3>
                <p style={{ color: colors.textMuted, fontSize: 14, lineHeight: 1.6 }}>
                  This application stores your CRM data locally in your browser using localStorage. 
                  This data never leaves your device and is not transmitted to any server. Your privacy is our priority.
                </p>
              </section>
              
              <section>
                <h3 style={{ color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 8 }}>Local Storage</h3>
                <p style={{ color: colors.textMuted, fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>We store the following data locally:</p>
                <ul style={{ color: colors.textMuted, fontSize: 14, paddingLeft: 20 }}>
                  <li>Lead and contact information</li>
                  <li>Call logs and statistics</li>
                  <li>Golf course assignments</li>
                  <li>Your preferences and settings</li>
                </ul>
              </section>
              
              <section>
                <h3 style={{ color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 8 }}>Data Deletion</h3>
                <p style={{ color: colors.textMuted, fontSize: 14, lineHeight: 1.6 }}>
                  You can delete all your data at any time by clearing your browser's localStorage for this site 
                  or using the "Clear All Data" option in Settings.
                </p>
              </section>
              
              <section>
                <h3 style={{ color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 8 }}>Contact</h3>
                <p style={{ color: colors.textMuted, fontSize: 14, lineHeight: 1.6 }}>
                  Questions? Contact us at{' '}
                  <a href="https://carloscrespo.info" target="_blank" rel="noopener noreferrer" style={{ color: colors.primary }}>carloscrespo.info</a>
                  {' '}or{' '}
                  <a href="https://github.com/Crespo1301" target="_blank" rel="noopener noreferrer" style={{ color: colors.primary }}>GitHub</a>.
                </p>
              </section>
            </div>
            
            <button onClick={() => setShowPrivacy(false)} style={{ ...buttonBase, width: '100%', marginTop: 20, background: colors.bgCard, color: colors.text }}>Close</button>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      {showTerms && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)' }} onClick={() => setShowTerms(false)}>
          <div style={{ background: colors.bgLight, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '28px', maxWidth: 600, width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: colors.text, marginBottom: 8, fontSize: '22px', fontWeight: '600' }}>Terms of Use</h2>
            <p style={{ color: colors.textMuted, fontSize: 12, marginBottom: 20 }}>Last updated: February 2026</p>
            
            <div style={{ display: 'grid', gap: 16 }}>
              {[
                { title: '1. Overview', text: 'This website provides a client-side CRM for cold calling operations. Your data is stored locally in your browser. We do not provide business, legal, or financial advice.' },
                { title: '2. No Warranties', text: 'The service is provided "as is" without warranties of any kind. You are responsible for verifying the accuracy of your data.' },
                { title: '3. Limitation of Liability', text: 'We are not liable for any losses or damages arising from the use of this service, including loss of data. Use the backup feature regularly.' },
                { title: '4. Data Ownership', text: 'You retain full ownership of all data you enter. We have no access to your locally stored data.' },
                { title: '5. Changes', text: 'We may update these terms. Continued use means you accept any updates.' }
              ].map((section, i) => (
                <div key={i} style={{ background: colors.bgCard, padding: 16, borderRadius: 10, border: `1px solid ${colors.border}` }}>
                  <h3 style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 6 }}>{section.title}</h3>
                  <p style={{ color: colors.textMuted, fontSize: 13, lineHeight: 1.5 }}>{section.text}</p>
                </div>
              ))}
            </div>
            
            <button onClick={() => setShowTerms(false)} style={{ ...buttonBase, width: '100%', marginTop: 20, background: colors.bgCard, color: colors.text }}>Close</button>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: colors.bgLight, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 28, maxWidth: 600, width: '90%' }}>
            <h2 style={{ color: colors.primary, marginBottom: 12, fontSize: 18, fontWeight: '600' }}>📥 Import Data</h2>
            <p style={{ color: colors.textMuted, marginBottom: 16, fontSize: 13 }}>Paste CSV (with headers) or JSON backup</p>
            <textarea value={importData} onChange={e => setImportData(e.target.value)} placeholder="business name,phone,email..." style={{ ...inputBase, height: 180, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button onClick={importFromCSV} style={{ ...buttonBase, flex: 1, background: colors.primary, color: '#fff' }}>Import</button>
              <button onClick={() => setShowImportModal(false)} style={{ ...buttonBase, background: colors.bgCard, color: colors.text }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: colors.bgLight, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 28, maxWidth: 400, width: '90%' }}>
            <h2 style={{ color: colors.warning, marginBottom: 20, fontSize: 18, fontWeight: '600' }}>📤 Export Data</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                { key: 'leads', label: `Active Leads (${leads.length})`, color: colors.success },
                { key: 'dnc', label: `DNC List (${dncList.length})`, color: colors.warning },
                { key: 'dead', label: `Dead Leads (${deadLeads.length})`, color: colors.danger },
                { key: 'calls', label: `Call Log (${callLog.length})`, color: colors.primary },
                { key: 'golfcourses', label: `Golf Courses (${golfCourses.length})`, color: colors.accent },
                { key: 'all', label: 'Full Backup (JSON)', color: colors.text },
              ].map(opt => (
                <button key={opt.key} onClick={() => exportToCSV(opt.key)} style={{ ...buttonBase, background: colors.bgCard, color: opt.color, border: `1px solid ${colors.border}`, textAlign: 'left' }}>{opt.label}</button>
              ))}
            </div>
            <button onClick={() => setShowExportModal(false)} style={{ ...buttonBase, width: '100%', marginTop: 16, background: colors.bg, color: colors.textMuted }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: colors.bgLight, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 28, maxWidth: 420, width: '90%' }}>
            <h2 style={{ color: colors.text, marginBottom: 20, fontSize: 18, fontWeight: '600' }}>⚙️ Settings</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', color: colors.textMuted, marginBottom: 6, fontSize: 12, fontWeight: '500' }}>Daily Call Goal</label>
                <input type="number" value={settings.dailyGoal} onChange={e => setSettings(prev => ({ ...prev, dailyGoal: parseInt(e.target.value) || 200 }))} style={inputBase} />
              </div>
              <div>
                <label style={{ display: 'block', color: colors.textMuted, marginBottom: 6, fontSize: 12, fontWeight: '500' }}>Active Golf Course</label>
                <select value={settings.activeGolfCourse || ''} onChange={e => setSettings(prev => ({ ...prev, activeGolfCourse: e.target.value || null }))} style={inputBase}>
                  <option value="">None selected</option>
                  {golfCourses.map(gc => <option key={gc.id} value={gc.id}>{gc.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
              <button onClick={() => { if(confirm('Clear ALL data?')) { setLeads([]); setDncList([]); setDeadLeads([]); setTrash([]); setEmails([]); setCallLog([]); setDailyStats({}); notify('🗑️ Data cleared'); setShowSettings(false); }}} style={{ ...buttonBase, background: colors.danger, color: '#fff' }}>🗑️ Clear All Data</button>
              <button onClick={() => setShowSettings(false)} style={{ ...buttonBase, background: colors.bgCard, color: colors.text }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {showLeadDetail && !editingLead && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20, backdropFilter: 'blur(4px)' }} onClick={() => setShowLeadDetail(null)}>
          <div style={{ background: colors.bgLight, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 28, maxWidth: 750, width: '100%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ color: colors.text, marginBottom: 4, fontSize: 22, fontWeight: '600' }}>
                  {showLeadDetail.priority === 'hot' && '🔥 '}{showLeadDetail.businessName}
                  {showLeadDetail.status === 'converted' && <span style={{ color: colors.success, marginLeft: 10, fontSize: 14 }}>✓ Converted</span>}
                </h2>
                <p style={{ color: colors.textMuted }}>{showLeadDetail.contactName}</p>
                {activeGolfCourse && showLeadDetail.golfCourseId === activeGolfCourse.id && (
                  <p style={{ color: colors.accent, fontSize: 12, marginTop: 4 }}>⛳ {activeGolfCourse.name}</p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditingLead(showLeadDetail)} style={{ ...buttonBase, background: colors.bgCard, color: colors.primary }}>✏️ Edit</button>
                <button onClick={() => tallyCall(showLeadDetail)} style={{ ...buttonBase, background: colors.success, color: '#fff' }}>📞 Call</button>
                <button onClick={() => setShowLeadDetail(null)} style={{ ...buttonBase, background: colors.bgCard, color: colors.textMuted }}>✕</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Phone', value: showLeadDetail.phone },
                { label: 'Email', value: showLeadDetail.email },
                { label: 'Website', value: showLeadDetail.website },
                { label: 'Industry', value: showLeadDetail.industry },
                { label: 'Source', value: showLeadDetail.source },
                { label: 'Call Date', value: formatDate(showLeadDetail.callDate || showLeadDetail.createdAt) },
              ].map(f => (
                <div key={f.label} style={{ background: colors.bgCard, padding: 14, borderRadius: 10 }}>
                  <div style={{ color: colors.textDim, fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</div>
                  <div style={{ fontSize: 14, wordBreak: 'break-all' }}>{f.value || '—'}</div>
                </div>
              ))}
              <div style={{ background: colors.bgCard, padding: 14, borderRadius: 10, gridColumn: 'span 2' }}>
                <div style={{ color: colors.textDim, fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Address</div>
                <div style={{ fontSize: 14 }}>{showLeadDetail.address || '—'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              <div style={{ background: colors.bgCard, padding: 16, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ color: colors.success, fontSize: 28, fontWeight: '700' }}>{showLeadDetail.callCount || 0}</div>
                <div style={{ color: colors.textDim, fontSize: 11 }}>Calls</div>
              </div>
              <div style={{ background: colors.bgCard, padding: 16, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ color: colors.primary, fontSize: 28, fontWeight: '700' }}>{showLeadDetail.emailCount || 0}</div>
                <div style={{ color: colors.textDim, fontSize: 11 }}>Emails</div>
              </div>
              <div style={{ background: colors.bgCard, padding: 16, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: colors.textDim }}>Last Called</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>{formatDate(showLeadDetail.lastCalled) || '—'}</div>
              </div>
              <div style={{ background: colors.bgCard, padding: 16, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: isOverdue(showLeadDetail.followUp) ? colors.danger : colors.textDim }}>Follow Up</div>
                <div style={{ fontSize: 13, marginTop: 4, color: isOverdue(showLeadDetail.followUp) ? colors.danger : colors.text }}>{formatDate(showLeadDetail.followUp) || '—'}</div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ color: colors.textDim, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Set Follow-up</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[1, 2, 3, 5, 7, 14, 30].map(d => (
                  <button key={d} onClick={() => setFollowUp(showLeadDetail, d)} style={{ ...buttonBase, padding: '8px 14px', background: colors.bgCard, color: colors.primary, fontSize: 12 }}>{d}d</button>
                ))}
                <button onClick={() => updateLead({ ...showLeadDetail, followUp: '' })} style={{ ...buttonBase, padding: '8px 14px', background: colors.bgCard, color: colors.textMuted, fontSize: 12 }}>Clear</button>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ color: colors.textDim, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</div>
              <textarea value={showLeadDetail.notes || ''} onChange={e => setShowLeadDetail({ ...showLeadDetail, notes: e.target.value })} onBlur={() => updateLead(showLeadDetail)} placeholder="Add notes..." style={{ ...inputBase, minHeight: 80, resize: 'vertical' }} />
            </div>

            {showLeadDetail.callHistory?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: colors.textDim, fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Call History</div>
                <div style={{ maxHeight: 140, overflowY: 'auto' }}>
                  {showLeadDetail.callHistory.slice().reverse().map((c, i) => (
                    <div key={i} style={{ padding: 12, background: colors.bgCard, borderRadius: 8, marginBottom: 6, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ color: colors.textMuted }}>{formatDateTime(c.timestamp)}</span>
                        {c.notes && <span style={{ marginLeft: 12, color: colors.text }}>{c.notes}</span>}
                      </div>
                      <button onClick={() => deleteCall(c.id)} style={{ background: 'transparent', border: 'none', color: colors.danger, cursor: 'pointer', fontSize: 12 }}>🗑️</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
              <button onClick={() => { const l = showLeadDetail; setLeads(p => p.filter(x => x.id !== l.id)); setDncList(p => [...p, { ...l, dncDate: new Date().toISOString() }]); setShowLeadDetail(null); notify(`🚫 ${l.businessName} → DNC`); }} style={{ ...buttonBase, background: colors.warning, color: '#000' }}>🚫 DNC</button>
              <button onClick={() => { const l = showLeadDetail; setLeads(p => p.filter(x => x.id !== l.id)); setDeadLeads(p => [...p, { ...l, deadDate: new Date().toISOString() }]); setShowLeadDetail(null); notify(`💀 ${l.businessName} → Dead`); }} style={{ ...buttonBase, background: colors.danger, color: '#fff' }}>💀 Dead</button>
              <button onClick={() => { updateLead({ ...showLeadDetail, status: 'converted' }); notify('🎉 Converted!'); }} style={{ ...buttonBase, background: colors.success, color: '#fff' }}>🎉 Convert</button>
              <button onClick={() => deleteLeadToTrash(showLeadDetail, 'lead')} style={{ ...buttonBase, background: colors.bgCard, color: colors.danger, marginLeft: 'auto' }}>🗑️ Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
          <div style={{ background: colors.bgLight, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 28, maxWidth: 700, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <h2 style={{ color: colors.text, marginBottom: 20, fontSize: 18, fontWeight: '600' }}>✏️ Edit Lead</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Business Name</label><input className="form-input" value={editingLead.businessName || ''} onChange={e => setEditingLead(p => ({ ...p, businessName: e.target.value }))} style={inputBase} /></div>
              <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Contact Name</label><input className="form-input" value={editingLead.contactName || ''} onChange={e => setEditingLead(p => ({ ...p, contactName: e.target.value }))} style={inputBase} /></div>
              <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Phone</label><input className="form-input" value={editingLead.phone || ''} onChange={e => setEditingLead(p => ({ ...p, phone: e.target.value }))} style={inputBase} /></div>
              <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Email</label><input className="form-input" value={editingLead.email || ''} onChange={e => setEditingLead(p => ({ ...p, email: e.target.value }))} style={inputBase} /></div>
              <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Website</label><input className="form-input" value={editingLead.website || ''} onChange={e => setEditingLead(p => ({ ...p, website: e.target.value }))} style={inputBase} /></div>
              <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Address</label><input className="form-input" value={editingLead.address || ''} onChange={e => setEditingLead(p => ({ ...p, address: e.target.value }))} style={inputBase} /></div>
              <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Industry</label><input className="form-input" value={editingLead.industry || ''} onChange={e => setEditingLead(p => ({ ...p, industry: e.target.value }))} style={inputBase} /></div>
              <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Source</label><input className="form-input" value={editingLead.source || ''} onChange={e => setEditingLead(p => ({ ...p, source: e.target.value }))} style={inputBase} /></div>
              <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Priority</label><select value={editingLead.priority || 'normal'} onChange={e => setEditingLead(p => ({ ...p, priority: e.target.value }))} style={inputBase}><option value="normal">Normal</option><option value="hot">🔥 Hot</option><option value="low">Low</option></select></div>
              <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Golf Course</label><select value={editingLead.golfCourseId || ''} onChange={e => setEditingLead(p => ({ ...p, golfCourseId: e.target.value }))} style={inputBase}><option value="">None</option>{golfCourses.map(gc => <option key={gc.id} value={gc.id}>{gc.name}</option>)}</select></div>
              <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Call Date</label><input type="date" value={formatDateForInput(editingLead.callDate || editingLead.createdAt)} onChange={e => setEditingLead(p => ({ ...p, callDate: e.target.value }))} style={inputBase} /></div>
              <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Follow-up Date</label><input type="date" value={formatDateForInput(editingLead.followUp)} onChange={e => setEditingLead(p => ({ ...p, followUp: e.target.value }))} style={inputBase} /></div>
              <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Notes</label><textarea value={editingLead.notes || ''} onChange={e => setEditingLead(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ ...inputBase, resize: 'vertical' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={() => updateLead(editingLead)} style={{ ...buttonBase, flex: 1, background: colors.success, color: '#fff' }}>Save Changes</button>
              <button onClick={() => { setEditingLead(null); }} style={{ ...buttonBase, background: colors.bgCard, color: colors.text }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Call Modal */}
      {editingCall && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: colors.bgLight, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 28, maxWidth: 500, width: '90%' }}>
            <h2 style={{ color: colors.text, marginBottom: 20, fontSize: 18, fontWeight: '600' }}>✏️ Edit Call</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Lead Name</label><input value={editingCall.leadName || ''} onChange={e => setEditingCall(p => ({ ...p, leadName: e.target.value }))} style={inputBase} /></div>
              <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Phone</label><input value={editingCall.phone || ''} onChange={e => setEditingCall(p => ({ ...p, phone: e.target.value }))} style={inputBase} /></div>
              <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Call Date</label><input type="date" value={formatDateForInput(editingCall.callDate || editingCall.timestamp)} onChange={e => setEditingCall(p => ({ ...p, callDate: e.target.value }))} style={inputBase} /></div>
              <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Outcome</label><select value={editingCall.outcome || 'completed'} onChange={e => setEditingCall(p => ({ ...p, outcome: e.target.value }))} style={inputBase}><option value="completed">Completed</option><option value="voicemail">Voicemail</option><option value="no-answer">No Answer</option><option value="callback">Callback</option><option value="interested">Interested</option><option value="not-interested">Not Interested</option></select></div>
              <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Notes</label><textarea value={editingCall.notes || ''} onChange={e => setEditingCall(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ ...inputBase, resize: 'vertical' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={() => updateCall(editingCall)} style={{ ...buttonBase, flex: 1, background: colors.success, color: '#fff' }}>Save Changes</button>
              <button onClick={() => { deleteCall(editingCall.id); setEditingCall(null); }} style={{ ...buttonBase, background: colors.danger, color: '#fff' }}>Delete</button>
              <button onClick={() => setEditingCall(null)} style={{ ...buttonBase, background: colors.bgCard, color: colors.text }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Golf Course Modal */}
      {editingGolfCourse && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: colors.bgLight, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 28, maxWidth: 550, width: '90%' }}>
            <h2 style={{ color: colors.accent, marginBottom: 20, fontSize: 18, fontWeight: '600' }}>⛳ Edit Golf Course</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Course Name</label><input value={editingGolfCourse.name || ''} onChange={e => setEditingGolfCourse(p => ({ ...p, name: e.target.value }))} style={inputBase} /></div>
              <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Address</label><input value={editingGolfCourse.address || ''} onChange={e => setEditingGolfCourse(p => ({ ...p, address: e.target.value }))} style={inputBase} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Phone</label><input value={editingGolfCourse.phone || ''} onChange={e => setEditingGolfCourse(p => ({ ...p, phone: e.target.value }))} style={inputBase} /></div>
                <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Region</label><input value={editingGolfCourse.region || ''} onChange={e => setEditingGolfCourse(p => ({ ...p, region: e.target.value }))} style={inputBase} /></div>
              </div>
              <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Contact Name</label><input value={editingGolfCourse.contactName || ''} onChange={e => setEditingGolfCourse(p => ({ ...p, contactName: e.target.value }))} style={inputBase} /></div>
              <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Email</label><input value={editingGolfCourse.email || ''} onChange={e => setEditingGolfCourse(p => ({ ...p, email: e.target.value }))} style={inputBase} /></div>
              <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Notes</label><textarea value={editingGolfCourse.notes || ''} onChange={e => setEditingGolfCourse(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ ...inputBase, resize: 'vertical' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={updateGolfCourse} style={{ ...buttonBase, flex: 1, background: colors.success, color: '#fff' }}>Save Changes</button>
              <button onClick={() => { deleteGolfCourse(editingGolfCourse.id); setEditingGolfCourse(null); }} style={{ ...buttonBase, background: colors.danger, color: '#fff' }}>Delete</button>
              <button onClick={() => setEditingGolfCourse(null)} style={{ ...buttonBase, background: colors.bgCard, color: colors.text }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MAIN LAYOUT                                                        */}
      {/* ================================================================== */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${colors.border}` }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: '700', background: 'linear-gradient(90deg, #4dabf7, #69db7c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 }}>
              COLD CALL CRM
              {activeGolfCourse && <span style={{ color: colors.accent, fontSize: 14, marginLeft: 12, fontWeight: '400', WebkitTextFillColor: colors.accent }}>⛳ {activeGolfCourse.name}</span>}
            </h1>
            <p style={{ color: colors.textDim, fontSize: 12 }}>Press <span style={{ background: colors.bgCard, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>/</span> for keyboard shortcuts</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {followUps.length > 0 && (
              <button onClick={() => setView('followups')} style={{ ...buttonBase, background: overdueCount > 0 ? colors.danger : colors.warning, color: '#000', fontWeight: '600' }}>
                📅 {followUps.length} Due {overdueCount > 0 && `(${overdueCount} overdue)`}
              </button>
            )}
            
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: colors.textDim, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today's Calls</div>
              <div style={{ fontSize: 36, fontWeight: '700', color: colors.success, lineHeight: 1 }}>{todaysCalls}</div>
            </div>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: `conic-gradient(${progress >= 100 ? colors.warning : colors.success} ${progress}%, ${colors.bgCard} ${progress}%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${progress >= 100 ? 'rgba(255,212,59,0.3)' : 'rgba(105,219,124,0.3)'}` }}>
              <div style={{ width: 82, height: 82, borderRadius: '50%', background: colors.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: '700' }}>{Math.max(0, settings.dailyGoal - todaysCalls)}</div>
                <div style={{ fontSize: 9, color: colors.textDim }}>to goal</div>
              </div>
            </div>
          </div>
        </header>

        {/* Progress Bar */}
        <div style={{ height: 6, background: colors.bgCard, borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(progress, 100)}%`, height: '100%', background: progress >= 100 ? `linear-gradient(90deg, ${colors.warning}, ${colors.warningDark})` : `linear-gradient(90deg, ${colors.success}, ${colors.successDark})`, transition: 'width 0.3s ease', boxShadow: progress >= 100 ? '0 0 10px rgba(255,212,59,0.5)' : '0 0 10px rgba(105,219,124,0.5)' }} />
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
            { key: 'golfcourses', label: 'G Courses', count: golfCourses.length },
            { key: 'trash', label: 'T Trash', count: trash.length },
            { key: 'analytics', label: 'A Analytics' },
            { key: 'emails', label: '- Emails', count: emails.length },
          ].map(t => (
            <button key={t.key} onClick={() => { setView(t.key); setSelectedIndex(0); }} style={{ 
              ...buttonBase, 
              padding: '8px 14px',
              background: view === t.key ? colors.primary : t.alert ? colors.danger : colors.bgCard, 
              color: view === t.key ? '#fff' : t.alert ? '#fff' : colors.textMuted, 
              fontSize: 12 
            }}>
              {t.label} {t.count !== undefined && <span style={{ opacity: 0.7 }}>({t.count})</span>}
            </button>
          ))}
          <button onClick={() => setView('addLead')} style={{ ...buttonBase, padding: '8px 14px', background: colors.warning, color: '#000', fontSize: 12, marginLeft: 'auto' }}>+ Add Lead</button>
        </nav>

        {/* Search Indicator */}
        {searchQuery && (
          <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: colors.warning, color: '#000', padding: '8px 24px', borderRadius: 20, fontWeight: '600', zIndex: 100, fontSize: 13 }}>
            🔍 {searchQuery}
          </div>
        )}

        {/* Main Content */}
        <main>
          {/* Dashboard */}
          {view === 'dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div style={{ background: colors.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}` }}>
                <h3 style={{ color: colors.success, marginBottom: 16, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📊 Today</h3>
                <div style={{ display: 'grid', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>Calls</span><span style={{ color: colors.success, fontWeight: '700', fontSize: 20 }}>{todaysCalls}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>Goal</span><span style={{ fontWeight: '700', fontSize: 20 }}>{settings.dailyGoal}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>Progress</span><span style={{ color: progress >= 100 ? colors.warning : colors.success, fontWeight: '700', fontSize: 20 }}>{progress.toFixed(0)}%</span></div>
                </div>
              </div>

              <div style={{ background: colors.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}` }}>
                <h3 style={{ color: colors.warning, marginBottom: 16, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎯 Leads</h3>
                <div style={{ display: 'grid', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>Active</span><span style={{ fontWeight: '700', fontSize: 20 }}>{leads.length}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>Hot 🔥</span><span style={{ color: colors.danger, fontWeight: '700', fontSize: 20 }}>{hotLeads}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>Follow-ups</span><span style={{ color: followUps.length > 0 ? colors.warning : colors.textMuted, fontWeight: '700', fontSize: 20 }}>{followUps.length}</span></div>
                </div>
              </div>

              <div style={{ background: colors.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}` }}>
                <h3 style={{ color: colors.primary, marginBottom: 16, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚡ Quick Actions</h3>
                <button onClick={() => tallyCall()} style={{ ...buttonBase, width: '100%', background: colors.success, color: '#fff', fontSize: 14, marginBottom: 10 }}>📞 Tally Call (Space)</button>
                <button onClick={() => setView('addLead')} style={{ ...buttonBase, width: '100%', background: colors.bgLight, color: colors.warning, border: `1px solid ${colors.warning}` }}>+ New Lead</button>
              </div>

              {/* Weekly Chart */}
              <div style={{ background: colors.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}` }}>
                <h3 style={{ color: colors.textMuted, marginBottom: 16, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📈 Last 7 Days</h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
                  {analytics.dailyBreakdown.map((d, i) => {
                    const max = Math.max(...analytics.dailyBreakdown.map(x => x.calls), 1);
                    const h = (d.calls / max) * 80;
                    return (
                      <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ height: h, background: i === 6 ? `linear-gradient(180deg, ${colors.success}, ${colors.successDark})` : colors.border, borderRadius: '4px 4px 0 0', minHeight: 4, marginBottom: 6 }} />
                        <div style={{ fontSize: 10, color: i === 6 ? colors.success : colors.textDim }}>{d.date}</div>
                        <div style={{ fontSize: 11, color: i === 6 ? colors.success : colors.textMuted, fontWeight: '600' }}>{d.calls}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Follow-ups */}
              {followUps.length > 0 && (
                <div style={{ background: colors.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${overdueCount > 0 ? colors.danger : colors.warning}` }}>
                  <h3 style={{ color: overdueCount > 0 ? colors.danger : colors.warning, marginBottom: 16, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📅 Follow-ups Due</h3>
                  {followUps.slice(0, 4).map(l => (
                    <div key={l.id} onClick={() => setShowLeadDetail(l)} style={{ padding: 12, background: colors.bgLight, borderRadius: 8, marginBottom: 8, cursor: 'pointer', borderLeft: `3px solid ${isOverdue(l.followUp) ? colors.danger : colors.warning}` }}>
                      <div style={{ fontWeight: '600', fontSize: 13 }}>{l.businessName}</div>
                      <div style={{ color: isOverdue(l.followUp) ? colors.danger : colors.textMuted, fontSize: 11 }}>{formatDate(l.followUp)} {isOverdue(l.followUp) && '(OVERDUE)'}</div>
                    </div>
                  ))}
                  {followUps.length > 4 && <button onClick={() => setView('followups')} style={{ ...buttonBase, width: '100%', background: 'transparent', color: colors.warning, border: `1px solid ${colors.border}`, fontSize: 12 }}>View all {followUps.length} →</button>}
                </div>
              )}

              {/* Active Golf Course */}
              {activeGolfCourse && (
                <div style={{ background: colors.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${colors.accent}` }}>
                  <h3 style={{ color: colors.accent, marginBottom: 16, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⛳ Active Course</h3>
                  <div style={{ fontWeight: '600', fontSize: 16, marginBottom: 8 }}>{activeGolfCourse.name}</div>
                  {activeGolfCourse.address && <div style={{ color: colors.textMuted, fontSize: 13, marginBottom: 4 }}>{activeGolfCourse.address}</div>}
                  {activeGolfCourse.phone && <div style={{ color: colors.textMuted, fontSize: 13 }}>{activeGolfCourse.phone}</div>}
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button onClick={() => setEditingGolfCourse(activeGolfCourse)} style={{ ...buttonBase, padding: '6px 12px', background: colors.bgLight, color: colors.accent, fontSize: 11 }}>Edit</button>
                    <button onClick={() => setView('golfcourses')} style={{ ...buttonBase, padding: '6px 12px', background: colors.bgLight, color: colors.textMuted, fontSize: 11 }}>All Courses</button>
                  </div>
                </div>
              )}

              {/* Recent Leads */}
              <div style={{ background: colors.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${colors.border}` }}>
                <h3 style={{ color: colors.textMuted, marginBottom: 16, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📋 Recent Leads</h3>
                {leads.slice(0, 5).map((l, i) => (
                  <div key={l.id} onClick={() => setShowLeadDetail(l)} style={{ padding: 12, background: i % 2 === 0 ? colors.bgLight : 'transparent', borderRadius: 8, marginBottom: 6, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '600', fontSize: 13 }}>{l.priority === 'hot' && '🔥 '}{l.businessName}</span>
                      <span style={{ color: colors.textMuted, fontSize: 11 }}>{l.callCount || 0} calls</span>
                    </div>
                    <div style={{ color: colors.textDim, fontSize: 11 }}>{l.phone}</div>
                  </div>
                ))}
                {leads.length === 0 && <p style={{ color: colors.textDim, textAlign: 'center', padding: 20, fontSize: 13 }}>No leads yet. Press + to add!</p>}
              </div>
            </div>
          )}

          {/* Analytics */}
          {view === 'analytics' && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {['week', 'month', 'all'].map(r => (
                  <button key={r} onClick={() => setAnalyticsRange(r)} style={{ ...buttonBase, background: analyticsRange === r ? colors.primary : colors.bgCard, color: analyticsRange === r ? '#fff' : colors.textMuted, fontSize: 12 }}>{r === 'week' ? '7 Days' : r === 'month' ? '30 Days' : 'All Time'}</button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                <div style={{ background: colors.bgCard, padding: 24, borderRadius: 12, textAlign: 'center', border: `1px solid ${colors.border}` }}><div style={{ color: colors.success, fontSize: 42, fontWeight: '700' }}>{analytics.totalCalls}</div><div style={{ color: colors.textMuted, fontSize: 12 }}>Total Calls</div></div>
                <div style={{ background: colors.bgCard, padding: 24, borderRadius: 12, textAlign: 'center', border: `1px solid ${colors.border}` }}><div style={{ color: colors.primary, fontSize: 42, fontWeight: '700' }}>{analytics.avgPerDay}</div><div style={{ color: colors.textMuted, fontSize: 12 }}>Avg/Day</div></div>
                <div style={{ background: colors.bgCard, padding: 24, borderRadius: 12, textAlign: 'center', border: `1px solid ${colors.border}` }}><div style={{ color: colors.warning, fontSize: 42, fontWeight: '700' }}>{analytics.leadsContacted}</div><div style={{ color: colors.textMuted, fontSize: 12 }}>Leads Contacted</div></div>
                <div style={{ background: colors.bgCard, padding: 24, borderRadius: 12, textAlign: 'center', border: `1px solid ${colors.border}` }}><div style={{ color: colors.danger, fontSize: 42, fontWeight: '700' }}>{analytics.maxDay.count}</div><div style={{ color: colors.textMuted, fontSize: 12 }}>Best Day</div></div>
              </div>

              {Object.keys(analytics.outcomes).length > 0 && (
                <div style={{ background: colors.bgCard, padding: 24, borderRadius: 12, border: `1px solid ${colors.border}` }}>
                  <h3 style={{ color: colors.textMuted, marginBottom: 16, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Outcomes</h3>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {Object.entries(analytics.outcomes).map(([k, v]) => (
                      <div key={k} style={{ padding: '12px 18px', background: colors.bgLight, borderRadius: 8 }}>
                        <span style={{ fontSize: 20, fontWeight: '700', color: colors.success, marginRight: 10 }}>{v}</span>
                        <span style={{ color: colors.textMuted, textTransform: 'capitalize', fontSize: 13 }}>{k}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ background: colors.bgCard, padding: 24, borderRadius: 12, border: `1px solid ${colors.border}` }}>
                <h3 style={{ color: colors.textMuted, marginBottom: 20, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Daily Breakdown</h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 150 }}>
                  {analytics.dailyBreakdown.map((d, i) => {
                    const max = Math.max(...analytics.dailyBreakdown.map(x => x.calls), 1);
                    const h = (d.calls / max) * 120;
                    return (
                      <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 14, color: colors.success, marginBottom: 4, fontWeight: '600' }}>{d.calls}</div>
                        <div style={{ height: h, background: i === 6 ? `linear-gradient(180deg, ${colors.success}, ${colors.successDark})` : `linear-gradient(180deg, ${colors.border}, ${colors.bgLight})`, borderRadius: '6px 6px 0 0', minHeight: 4 }} />
                        <div style={{ fontSize: 12, color: i === 6 ? colors.success : colors.textDim, marginTop: 8 }}>{d.date}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* List Views */}
          {['leads', 'followups', 'dnc', 'dead', 'calllog', 'trash'].includes(view) && (
            <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', background: colors.bgLight, borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 15, color: colors.text, fontWeight: '600' }}>
                  {view === 'leads' && '🎯 Active Leads'}
                  {view === 'followups' && '📅 Follow-ups Due'}
                  {view === 'dnc' && '🚫 Do Not Call'}
                  {view === 'dead' && '💀 Dead Leads'}
                  {view === 'calllog' && '📞 Call Log'}
                  {view === 'trash' && '🗑️ Trash'}
                </h2>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: colors.textDim, fontSize: 12 }}>{getCurrentList().length} entries</span>
                  {view === 'trash' && trash.length > 0 && (
                    <button onClick={emptyTrash} style={{ ...buttonBase, padding: '6px 12px', background: colors.danger, color: '#fff', fontSize: 11 }}>Empty Trash</button>
                  )}
                  {['leads', 'dnc', 'dead'].includes(view) && (
                    <button onClick={() => { setShowExportModal(true); }} style={{ ...buttonBase, padding: '6px 12px', background: colors.bgCard, color: colors.primary, fontSize: 11, border: `1px solid ${colors.border}` }}>Export</button>
                  )}
                </div>
              </div>
              
              <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                {getCurrentList().map((item, idx) => (
                  <div key={item.id + (item.type || '')} onClick={() => { 
                    setSelectedIndex(idx); 
                    if (view === 'calllog') setEditingCall(item);
                    else if (view === 'trash') { /* click to select only */ }
                    else if (view !== 'trash') setShowLeadDetail(item);
                  }} style={{ 
                    padding: '14px 20px', 
                    background: idx === selectedIndex ? `${colors.primary}15` : 'transparent', 
                    borderLeft: idx === selectedIndex ? `3px solid ${colors.primary}` : '3px solid transparent', 
                    borderBottom: `1px solid ${colors.border}`, 
                    cursor: 'pointer' 
                  }}>
                    {view === 'calllog' ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: 14 }}>{item.leadName}</div>
                          <div style={{ color: colors.textMuted, fontSize: 12 }}>{item.phone}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: colors.success, fontSize: 12 }}>{item.outcome}</div>
                          <div style={{ color: colors.textDim, fontSize: 11 }}>{formatDateTime(item.callDate || item.timestamp)}</div>
                        </div>
                      </div>
                    ) : view === 'trash' ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: 14 }}>{item.businessName || item.leadName || 'Unknown'}</div>
                          <div style={{ color: colors.textMuted, fontSize: 12 }}>Type: {item.type} • Deleted: {formatDate(item.deletedAt)}</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); restoreFromTrash(item); }} style={{ ...buttonBase, padding: '6px 12px', background: colors.success, color: '#fff', fontSize: 11 }}>Restore</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: '600', marginBottom: 2 }}>
                            {item.priority === 'hot' && <span style={{ color: colors.danger }}>🔥 </span>}
                            {item.businessName}
                            {item.status === 'converted' && <span style={{ color: colors.success, marginLeft: 8, fontSize: 12 }}>✓ Converted</span>}
                          </div>
                          <div style={{ color: colors.textMuted, fontSize: 12 }}>
                            {item.contactName && <span>{item.contactName} • </span>}{item.phone}
                            {item.industry && <span style={{ color: colors.textDim }}> • {item.industry}</span>}
                          </div>
                          {item.notes && <div style={{ color: colors.textDim, fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>{item.notes.substring(0, 60)}...</div>}
                        </div>
                        <div style={{ textAlign: 'right', marginLeft: 16 }}>
                          {['leads', 'followups'].includes(view) && (
                            <>
                              <div style={{ color: colors.success, fontSize: 13, fontWeight: '600' }}>{item.callCount || 0} calls</div>
                              {item.followUp && <div style={{ color: isOverdue(item.followUp) ? colors.danger : colors.textDim, fontSize: 11, marginTop: 2 }}>📅 {formatDate(item.followUp)}</div>}
                            </>
                          )}
                          {view === 'dnc' && <div style={{ color: colors.warning, fontSize: 11 }}>{formatDate(item.dncDate)}</div>}
                          {view === 'dead' && <div style={{ color: colors.danger, fontSize: 11 }}>{formatDate(item.deadDate)}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {getCurrentList().length === 0 && <div style={{ padding: 40, textAlign: 'center', color: colors.textDim }}>{searchQuery ? `No results for "${searchQuery}"` : 'No entries'}</div>}
              </div>
            </div>
          )}

          {/* Golf Courses */}
          {view === 'golfcourses' && (
            <div style={{ display: 'grid', gap: 16 }}>
              {/* Add Golf Course Form */}
              <div style={{ background: colors.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${colors.accent}` }}>
                <h3 style={{ color: colors.accent, marginBottom: 16, fontSize: 14, fontWeight: '600' }}>⛳ Add Golf Course</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <input placeholder="Course Name *" value={golfCourseForm.name} onChange={e => setGolfCourseForm(p => ({ ...p, name: e.target.value }))} style={inputBase} />
                  <input placeholder="Address" value={golfCourseForm.address} onChange={e => setGolfCourseForm(p => ({ ...p, address: e.target.value }))} style={inputBase} />
                  <input placeholder="Phone" value={golfCourseForm.phone} onChange={e => setGolfCourseForm(p => ({ ...p, phone: e.target.value }))} style={inputBase} />
                  <input placeholder="Contact Name" value={golfCourseForm.contactName} onChange={e => setGolfCourseForm(p => ({ ...p, contactName: e.target.value }))} style={inputBase} />
                  <input placeholder="Email" value={golfCourseForm.email} onChange={e => setGolfCourseForm(p => ({ ...p, email: e.target.value }))} style={inputBase} />
                  <input placeholder="Region" value={golfCourseForm.region} onChange={e => setGolfCourseForm(p => ({ ...p, region: e.target.value }))} style={inputBase} />
                </div>
                <div style={{ marginTop: 12 }}>
                  <textarea placeholder="Notes" value={golfCourseForm.notes} onChange={e => setGolfCourseForm(p => ({ ...p, notes: e.target.value }))} rows={2} style={{ ...inputBase, resize: 'vertical' }} />
                </div>
                <button onClick={addGolfCourse} style={{ ...buttonBase, marginTop: 12, background: colors.accent, color: '#fff' }}>Add Course</button>
              </div>

              {/* Golf Courses List */}
              <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', background: colors.bgLight, borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between' }}>
                  <h2 style={{ fontSize: 15, color: colors.text, fontWeight: '600' }}>⛳ Golf Courses</h2>
                  <span style={{ color: colors.textDim, fontSize: 12 }}>{golfCourses.length} courses</span>
                </div>
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {golfCourses.map((gc, idx) => (
                    <div key={gc.id} onClick={() => { setSelectedIndex(idx); setEditingGolfCourse(gc); }} style={{ 
                      padding: '14px 20px', 
                      background: settings.activeGolfCourse === gc.id ? `${colors.accent}20` : idx === selectedIndex ? `${colors.primary}15` : 'transparent',
                      borderLeft: settings.activeGolfCourse === gc.id ? `3px solid ${colors.accent}` : idx === selectedIndex ? `3px solid ${colors.primary}` : '3px solid transparent',
                      borderBottom: `1px solid ${colors.border}`,
                      cursor: 'pointer'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: 14 }}>
                            {gc.name}
                            {settings.activeGolfCourse === gc.id && <span style={{ color: colors.accent, marginLeft: 8, fontSize: 11 }}>✓ Active</span>}
                          </div>
                          <div style={{ color: colors.textMuted, fontSize: 12 }}>{gc.address} {gc.region && `• ${gc.region}`}</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setSettings(prev => ({ ...prev, activeGolfCourse: gc.id })); notify(`⛳ ${gc.name} set as active`); }} style={{ ...buttonBase, padding: '6px 12px', background: settings.activeGolfCourse === gc.id ? colors.bgLight : colors.accent, color: settings.activeGolfCourse === gc.id ? colors.textMuted : '#fff', fontSize: 11 }}>
                          {settings.activeGolfCourse === gc.id ? 'Active' : 'Set Active'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {golfCourses.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: colors.textDim }}>No golf courses yet. Add one above!</div>}
                </div>
              </div>
            </div>
          )}

          {/* Emails */}
          {view === 'emails' && (
            <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', background: colors.bgLight, borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: 15, color: colors.primary, fontWeight: '600' }}>📧 Email Log</h2>
                <button onClick={() => setView('addEmail')} style={{ ...buttonBase, padding: '6px 14px', background: colors.primary, color: '#fff', fontSize: 11 }}>* Compose</button>
              </div>
              <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                {emails.map((e, idx) => (
                  <div key={e.id} onClick={() => setSelectedIndex(idx)} style={{ padding: '14px 20px', background: idx === selectedIndex ? `${colors.primary}15` : 'transparent', borderLeft: idx === selectedIndex ? `3px solid ${colors.primary}` : '3px solid transparent', borderBottom: `1px solid ${colors.border}`, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div><div style={{ fontWeight: '600', marginBottom: 4, fontSize: 14 }}>{e.subject}</div><div style={{ color: colors.textMuted, fontSize: 12 }}>To: {e.to}</div></div>
                      <div style={{ color: colors.textDim, fontSize: 11 }}>{formatDateTime(e.sentAt)}</div>
                    </div>
                    <div style={{ color: colors.textDim, fontSize: 12, marginTop: 6 }}>{e.body.substring(0, 80)}...</div>
                  </div>
                ))}
                {emails.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: colors.textDim }}>No emails. Press * to compose.</div>}
              </div>
            </div>
          )}

          {/* Add Lead Form */}
          {view === 'addLead' && (
            <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.warning}`, padding: 28, maxWidth: 700, margin: '0 auto' }}>
              <h2 style={{ color: colors.warning, marginBottom: 20, fontSize: 18, fontWeight: '600' }}>➕ Add New Lead</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Business Name *</label><input className="form-input" value={formData.businessName} onChange={e => setFormData(p => ({ ...p, businessName: e.target.value }))} style={inputBase} /></div>
                <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Contact Name</label><input className="form-input" value={formData.contactName} onChange={e => setFormData(p => ({ ...p, contactName: e.target.value }))} style={inputBase} /></div>
                <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Phone *</label><input className="form-input" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} style={inputBase} /></div>
                <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Email</label><input className="form-input" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} style={inputBase} /></div>
                <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Website</label><input className="form-input" value={formData.website} onChange={e => setFormData(p => ({ ...p, website: e.target.value }))} style={inputBase} /></div>
                <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Address</label><input className="form-input" value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} style={inputBase} /></div>
                <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Industry</label><input className="form-input" value={formData.industry} onChange={e => setFormData(p => ({ ...p, industry: e.target.value }))} style={inputBase} /></div>
                <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Source</label><input className="form-input" value={formData.source} onChange={e => setFormData(p => ({ ...p, source: e.target.value }))} style={inputBase} /></div>
                <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Priority</label><select value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))} style={inputBase}><option value="normal">Normal</option><option value="hot">🔥 Hot</option><option value="low">Low</option></select></div>
                <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Golf Course</label><select value={formData.golfCourseId} onChange={e => setFormData(p => ({ ...p, golfCourseId: e.target.value }))} style={inputBase}><option value="">None</option>{golfCourses.map(gc => <option key={gc.id} value={gc.id}>{gc.name}</option>)}</select></div>
                <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Call Date</label><input type="date" value={formData.callDate} onChange={e => setFormData(p => ({ ...p, callDate: e.target.value }))} style={inputBase} /></div>
                <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Follow-up</label><input type="date" value={formData.followUp} onChange={e => setFormData(p => ({ ...p, followUp: e.target.value }))} style={inputBase} /></div>
                <div style={{ gridColumn: 'span 2' }}><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Notes</label><textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ ...inputBase, resize: 'vertical' }} /></div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button onClick={submitLead} style={{ ...buttonBase, flex: 1, background: colors.success, color: '#fff' }}>Save Lead</button>
                <button onClick={() => setView('dashboard')} style={{ ...buttonBase, background: colors.bgLight, color: colors.text }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Add Email Form */}
          {view === 'addEmail' && (
            <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.primary}`, padding: 28, maxWidth: 600, margin: '0 auto' }}>
              <h2 style={{ color: colors.primary, marginBottom: 20, fontSize: 18, fontWeight: '600' }}>📧 Log Email</h2>
              <div style={{ display: 'grid', gap: 14 }}>
                <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>To *</label><input className="form-input" type="email" value={emailForm.to} onChange={e => setEmailForm(p => ({ ...p, to: e.target.value }))} style={inputBase} /></div>
                <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Subject *</label><input className="form-input" value={emailForm.subject} onChange={e => setEmailForm(p => ({ ...p, subject: e.target.value }))} style={inputBase} /></div>
                <div><label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Body</label><textarea value={emailForm.body} onChange={e => setEmailForm(p => ({ ...p, body: e.target.value }))} rows={6} style={{ ...inputBase, resize: 'vertical' }} /></div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button onClick={submitEmail} style={{ ...buttonBase, flex: 1, background: colors.primary, color: '#fff' }}>Save Email</button>
                <button onClick={() => setView('dashboard')} style={{ ...buttonBase, background: colors.bgLight, color: colors.text }}>Cancel</button>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer style={{ marginTop: 40, paddingTop: 24, borderTop: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Main Footer Content */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ color: colors.textDim, fontSize: 12 }}>
                © {new Date().getFullYear()} Cold Call CRM. Created by{' '}
                <a href="https://carloscrespo.info" target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, textDecoration: 'none' }}>Carlos Crespo</a>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
                <button onClick={() => setShowPrivacy(true)} style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
                  Privacy Policy
                </button>
                <button onClick={() => setShowTerms(true)} style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
                  Terms
                </button>
                <button onClick={() => setShowSettings(true)} style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
                  Settings
                </button>
                <a href="https://github.com/Crespo1301" target="_blank" rel="noopener noreferrer" style={{ color: colors.textMuted, textDecoration: 'none' }}>
                  GitHub
                </a>
              </div>
            </div>
            
            {/* Keyboard Shortcuts Hint */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ color: colors.textDim, fontSize: 11 }}>
                <span style={{ marginRight: 16 }}><span style={{ background: colors.bgCard, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>/</span> Help</span>
                <span style={{ marginRight: 16 }}><span style={{ background: colors.bgCard, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>F</span> Follow-ups</span>
                <span style={{ marginRight: 16 }}><span style={{ background: colors.bgCard, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>G</span> Golf Courses</span>
                <span style={{ marginRight: 16 }}><span style={{ background: colors.bgCard, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>T</span> Trash</span>
                <span style={{ marginRight: 16 }}><span style={{ background: colors.bgCard, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>I</span> Import</span>
                <span><span style={{ background: colors.bgCard, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>E</span> Export</span>
              </div>
              <div style={{ color: colors.textDim, fontSize: 11 }}>
                Data saved locally in browser
              </div>
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        * {
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #373a40;
          border-radius: 3px;
        }
          ::-webkit-scrollbar-thumb:hover {
            background: #5c5f66;
          }
          
          input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(0.7);
            cursor: pointer;
          }
          
          input:focus, textarea:focus, select:focus {
            border-color: #4dabf7 !important;
            outline: none;
          }
          
          button:hover {
            filter: brightness(1.1);
          }
          
          button:active {
            transform: scale(0.98);
          }
          
          ::selection {
            background: #4dabf7;
            color: #fff;
          }
        `}</style>
    </div>
  );
}