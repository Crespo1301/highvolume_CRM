import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { STORAGE_KEYS, loadData, saveData, generateId, isTodayOrPast, isOverdue, DEFAULT_SETTINGS } from '../utils/helpers';

const CRMContext = createContext(null);

export function CRMProvider({ children }) {
  // Core data
  const [leads, setLeads] = useState(() => loadData(STORAGE_KEYS.leads, []));
  const [dncList, setDncList] = useState(() => loadData(STORAGE_KEYS.dnc, []));
  const [deadLeads, setDeadLeads] = useState(() => loadData(STORAGE_KEYS.dead, []));
  const [trash, setTrash] = useState(() => loadData(STORAGE_KEYS.trash, []));
  const [emails, setEmails] = useState(() => loadData(STORAGE_KEYS.emails, []));
  const [callLog, setCallLog] = useState(() => loadData(STORAGE_KEYS.callLog, []));
  const [dailyStats, setDailyStats] = useState(() => loadData(STORAGE_KEYS.stats, {}));
  const [golfCourses, setGolfCourses] = useState(() => loadData(STORAGE_KEYS.golfCourses, []));
  const [settings, setSettings] = useState(() => loadData(STORAGE_KEYS.settings, DEFAULT_SETTINGS));

  // UI state
  const [view, setView] = useState('dashboard');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [notification, setNotification] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [analyticsRange, setAnalyticsRange] = useState('week');

  // Modal state
  const [modals, setModals] = useState({
    help: false, import: false, export: false, settings: false, privacy: false, terms: false,
    leadDetail: null, editLead: null, editCall: null, editGolfCourse: null
  });

  const openModal = (key, value = true) => setModals(m => ({ ...m, [key]: value }));
  const closeModal = (key) => setModals(m => ({ ...m, [key]: key.includes('edit') || key.includes('Detail') ? null : false }));
  const closeAllModals = () => setModals({ help: false, import: false, export: false, settings: false, privacy: false, terms: false, leadDetail: null, editLead: null, editCall: null, editGolfCourse: null });

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

  // Computed values
  const todayKey = new Date().toDateString();
  const todaysCalls = dailyStats[todayKey] || 0;
  const progress = Math.min(100, (todaysCalls / settings.dailyGoal) * 100);
  const hotLeads = leads.filter(l => l.priority === 'hot').length;
  const activeGolfCourse = useMemo(() => golfCourses.find(gc => gc.id === settings.activeGolfCourse) || null, [golfCourses, settings.activeGolfCourse]);
  const followUps = useMemo(() => leads.filter(l => l.followUp && isTodayOrPast(l.followUp)).sort((a, b) => new Date(a.followUp) - new Date(b.followUp)), [leads]);
  const overdueCount = useMemo(() => leads.filter(l => l.followUp && isOverdue(l.followUp)).length, [leads]);

  // Notification
  const notify = useCallback((msg) => { setNotification(msg); setTimeout(() => setNotification(''), 2500); }, []);

  // Tally call
  const tallyCall = useCallback((lead = null, outcome = 'completed', notes = '') => {
    const now = new Date().toISOString();
    const today = new Date().toDateString();
    setDailyStats(prev => ({ ...prev, [today]: (prev[today] || 0) + 1 }));
    const callEntry = { id: generateId(), timestamp: now, callDate: now, leadId: lead?.id || null, leadName: lead?.businessName || 'Manual Tally', phone: lead?.phone || '', outcome, notes, golfCourseId: settings.activeGolfCourse };
    setCallLog(prev => [callEntry, ...prev.slice(0, 999)]);
    if (lead) {
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, lastCalled: now, callCount: (l.callCount || 0) + 1, callHistory: [...(l.callHistory || []), { id: generateId(), timestamp: now, outcome, notes }] } : l));
    }
    notify(`📞 Call tallied! Today: ${(dailyStats[today] || 0) + 1}`);
  }, [dailyStats, notify, settings.activeGolfCourse]);

  // Lead actions
  const addLead = useCallback((data) => {
    if (!data.businessName && !data.phone) { notify('❌ Name or phone required'); return false; }
    setLeads(prev => [{ id: generateId(), ...data, createdAt: new Date().toISOString(), callCount: 0, callHistory: [], golfCourseId: data.golfCourseId || settings.activeGolfCourse }, ...prev]);
    notify(`✅ ${data.businessName || 'Lead'} added!`);
    return true;
  }, [notify, settings.activeGolfCourse]);

  const updateLead = useCallback((lead) => { setLeads(prev => prev.map(l => l.id === lead.id ? lead : l)); openModal('leadDetail', lead); closeModal('editLead'); notify('✅ Lead updated'); }, [notify]);
  const moveToDNC = useCallback((lead) => { setLeads(prev => prev.filter(l => l.id !== lead.id)); setDncList(prev => [...prev, { ...lead, dncDate: new Date().toISOString() }]); notify(`🚫 ${lead.businessName} → DNC`); }, [notify]);
  const moveToDead = useCallback((lead) => { setLeads(prev => prev.filter(l => l.id !== lead.id)); setDeadLeads(prev => [...prev, { ...lead, deadDate: new Date().toISOString() }]); notify(`💀 ${lead.businessName} → Dead`); }, [notify]);
  const restoreFromDNC = useCallback((lead) => { setDncList(prev => prev.filter(l => l.id !== lead.id)); setLeads(prev => [...prev, { ...lead, restoredAt: new Date().toISOString() }]); notify(`✅ ${lead.businessName} restored`); }, [notify]);
  const restoreFromDead = useCallback((lead) => { setDeadLeads(prev => prev.filter(l => l.id !== lead.id)); setLeads(prev => [...prev, { ...lead, restoredAt: new Date().toISOString() }]); notify(`✅ ${lead.businessName} restored`); }, [notify]);
  
  const deleteToTrash = useCallback((item, type) => {
    if (type === 'lead') setLeads(prev => prev.filter(l => l.id !== item.id));
    else if (type === 'dnc') setDncList(prev => prev.filter(l => l.id !== item.id));
    else if (type === 'dead') setDeadLeads(prev => prev.filter(l => l.id !== item.id));
    setTrash(prev => [...prev, { ...item, type, deletedAt: new Date().toISOString() }]);
    closeModal('leadDetail');
    notify('🗑️ Moved to trash');
  }, [notify]);

  const restoreFromTrash = useCallback((item) => {
    if (item.type === 'call') { setCallLog(prev => [item, ...prev]); setDailyStats(prev => ({ ...prev, [new Date(item.timestamp).toDateString()]: (prev[new Date(item.timestamp).toDateString()] || 0) + 1 })); }
    else if (item.type === 'lead') setLeads(prev => [...prev, item]);
    else if (item.type === 'dnc') setDncList(prev => [...prev, item]);
    else if (item.type === 'dead') setDeadLeads(prev => [...prev, item]);
    setTrash(prev => prev.filter(t => !(t.id === item.id && t.type === item.type)));
    notify('✅ Restored from trash');
  }, [notify]);

  const emptyTrash = useCallback(() => { if (trash.length && confirm(`Delete ${trash.length} items permanently?`)) { setTrash([]); notify('🗑️ Trash emptied'); } }, [trash, notify]);

  // Call actions
  const deleteCall = useCallback((callId) => {
    const call = callLog.find(c => c.id === callId);
    if (!call) return;
    setTrash(prev => [...prev, { ...call, type: 'call', deletedAt: new Date().toISOString() }]);
    setCallLog(prev => prev.filter(c => c.id !== callId));
    setDailyStats(prev => ({ ...prev, [new Date(call.timestamp).toDateString()]: Math.max(0, (prev[new Date(call.timestamp).toDateString()] || 1) - 1) }));
    if (call.leadId) setLeads(prev => prev.map(l => l.id === call.leadId ? { ...l, callCount: Math.max(0, (l.callCount || 1) - 1), callHistory: (l.callHistory || []).filter(h => h.id !== callId) } : l));
    notify('🗑️ Call deleted');
  }, [callLog, notify]);

  const updateCall = useCallback((call) => { setCallLog(prev => prev.map(c => c.id === call.id ? call : c)); closeModal('editCall'); notify('✅ Call updated'); }, [notify]);

  // Golf course actions
  const addGolfCourse = useCallback((data) => { if (!data.name) { notify('❌ Name required'); return false; } setGolfCourses(prev => [...prev, { id: generateId(), ...data, createdAt: new Date().toISOString() }]); notify('⛳ Course added'); return true; }, [notify]);
  const updateGolfCourse = useCallback((course) => { setGolfCourses(prev => prev.map(gc => gc.id === course.id ? course : gc)); closeModal('editGolfCourse'); notify('✅ Course updated'); }, [notify]);
  const deleteGolfCourse = useCallback((id) => { if (confirm('Delete course?')) { setGolfCourses(prev => prev.filter(gc => gc.id !== id)); if (settings.activeGolfCourse === id) setSettings(prev => ({ ...prev, activeGolfCourse: null })); notify('🗑️ Course deleted'); } }, [settings.activeGolfCourse, notify]);

  // Email actions
  const addEmail = useCallback((data) => { if (!data.to || !data.subject) { notify('❌ To and subject required'); return false; } setEmails(prev => [{ id: generateId(), ...data, sentAt: new Date().toISOString(), status: 'logged' }, ...prev]); if (data.leadId) setLeads(prev => prev.map(l => l.id === data.leadId ? { ...l, lastEmailed: new Date().toISOString(), emailCount: (l.emailCount || 0) + 1 } : l)); notify('📧 Email logged!'); return true; }, [notify]);

  // Get current list
  const getCurrentList = useCallback(() => {
    const q = searchQuery.toLowerCase();
    const filter = (item) => !q || item.businessName?.toLowerCase().includes(q) || item.contactName?.toLowerCase().includes(q) || item.phone?.includes(q);
    switch (view) {
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

  // Analytics
  const analytics = useMemo(() => {
    const now = new Date();
    let startDate = analyticsRange === 'week' ? new Date(now.setDate(now.getDate() - 7)) : analyticsRange === 'month' ? new Date(now.setMonth(now.getMonth() - 1)) : new Date(0);
    const filtered = callLog.filter(c => new Date(c.timestamp) >= startDate);
    const stats = Object.entries(dailyStats).filter(([d]) => new Date(d) >= startDate);
    const dailyBreakdown = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); dailyBreakdown.push({ date: d.toLocaleDateString('en-US', { weekday: 'short' }), calls: dailyStats[d.toDateString()] || 0 }); }
    return {
      totalCalls: filtered.length,
      avgPerDay: stats.filter(([, c]) => c > 0).length > 0 ? Math.round(filtered.length / stats.filter(([, c]) => c > 0).length) : 0,
      maxDay: stats.reduce((m, [d, c]) => c > m.count ? { date: d, count: c } : m, { date: '', count: 0 }),
      outcomes: filtered.reduce((a, c) => ({ ...a, [c.outcome]: (a[c.outcome] || 0) + 1 }), {}),
      leadsContacted: new Set(filtered.filter(c => c.leadId).map(c => c.leadId)).size,
      dailyBreakdown
    };
  }, [callLog, dailyStats, analyticsRange]);

  const clearAllData = useCallback(() => { if (confirm('Clear ALL data?')) { setLeads([]); setDncList([]); setDeadLeads([]); setTrash([]); setEmails([]); setCallLog([]); setDailyStats({}); notify('🗑️ Data cleared'); } }, [notify]);

  return (
    <CRMContext.Provider value={{
      leads, dncList, deadLeads, trash, emails, callLog, dailyStats, golfCourses, settings, setSettings,
      view, setView, selectedIndex, setSelectedIndex, notification, searchQuery, setSearchQuery, analyticsRange, setAnalyticsRange,
      modals, openModal, closeModal, closeAllModals,
      todaysCalls, progress, hotLeads, activeGolfCourse, followUps, overdueCount, analytics,
      notify, tallyCall, addLead, updateLead, moveToDNC, moveToDead, restoreFromDNC, restoreFromDead, deleteToTrash, restoreFromTrash, emptyTrash,
      deleteCall, updateCall, addGolfCourse, updateGolfCourse, deleteGolfCourse, addEmail, getCurrentList, clearAllData,
      setLeads, setDncList, setDeadLeads, setCallLog, setGolfCourses, setEmails
    }}>
      {children}
    </CRMContext.Provider>
  );
}

export const useCRM = () => { const ctx = useContext(CRMContext); if (!ctx) throw new Error('useCRM must be within CRMProvider'); return ctx; };
