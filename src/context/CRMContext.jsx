import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { STORAGE_KEYS, loadData, saveData, generateId, isTodayOrPast, isOverdue, DEFAULT_SETTINGS, SORT_OPTIONS } from '../utils/helpers';

const CRMContext = createContext(null);

export function CRMProvider({ children }) {
  // Core data
  const [leads, setLeads] = useState(() => loadData(STORAGE_KEYS.leads, []));
  const [dncList, setDncList] = useState(() => loadData(STORAGE_KEYS.dnc, []));
  const [deadLeads, setDeadLeads] = useState(() => loadData(STORAGE_KEYS.dead, []));
  const [convertedLeads, setConvertedLeads] = useState(() => loadData(STORAGE_KEYS.converted, []));
  const [trash, setTrash] = useState(() => loadData(STORAGE_KEYS.trash, []));
  const [emails, setEmails] = useState(() => loadData(STORAGE_KEYS.emails, []));
  const [callLog, setCallLog] = useState(() => loadData(STORAGE_KEYS.callLog, []));
  const [dailyStats, setDailyStats] = useState(() => loadData(STORAGE_KEYS.stats, {}));
  const [golfCourses, setGolfCourses] = useState(() => loadData(STORAGE_KEYS.golfCourses, []));
  const [sales, setSales] = useState(() => loadData(STORAGE_KEYS.sales, []));
  const [settings, setSettings] = useState(() => loadData(STORAGE_KEYS.settings, DEFAULT_SETTINGS));

  // UI state
  const [view, setView] = useState('dashboard');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [notification, setNotification] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [analyticsRange, setAnalyticsRange] = useState('week');
  const [sortBy, setSortBy] = useState('newest');
  const [filters, setFilters] = useState(() => loadData(STORAGE_KEYS.filters, { golfCourseId: 'all', industry: 'all', priority: 'all', source: 'all', outcome: 'all', saleType: 'all' }));

  // Modal state
  const [modals, setModals] = useState({
    help: false, import: false, export: false, settings: false, privacy: false, terms: false,
    leadDetail: null, editLead: null, editCall: null, editGolfCourse: null, recordSale: null
  });

  const openModal = (key, value = true) => setModals(m => ({ ...m, [key]: value }));
  const closeModal = (key) => setModals(m => ({ ...m, [key]: key.includes('edit') || key.includes('Detail') || key === 'recordSale' ? null : false }));
  const closeAllModals = () => setModals({ help: false, import: false, export: false, settings: false, privacy: false, terms: false, leadDetail: null, editLead: null, editCall: null, editGolfCourse: null, recordSale: null });

  // Persist data
  useEffect(() => { saveData(STORAGE_KEYS.leads, leads); }, [leads]);
  useEffect(() => { saveData(STORAGE_KEYS.dnc, dncList); }, [dncList]);
  useEffect(() => { saveData(STORAGE_KEYS.dead, deadLeads); }, [deadLeads]);
  useEffect(() => { saveData(STORAGE_KEYS.converted, convertedLeads); }, [convertedLeads]);
  useEffect(() => { saveData(STORAGE_KEYS.trash, trash); }, [trash]);
  useEffect(() => { saveData(STORAGE_KEYS.emails, emails); }, [emails]);
  useEffect(() => { saveData(STORAGE_KEYS.callLog, callLog); }, [callLog]);
  useEffect(() => { saveData(STORAGE_KEYS.stats, dailyStats); }, [dailyStats]);
  useEffect(() => { saveData(STORAGE_KEYS.golfCourses, golfCourses); }, [golfCourses]);
  useEffect(() => { saveData(STORAGE_KEYS.sales, sales); }, [sales]);
  useEffect(() => { saveData(STORAGE_KEYS.settings, settings); }, [settings]);
  useEffect(() => { saveData(STORAGE_KEYS.filters, filters); }, [filters]);

  // Computed values
  const todayKey = new Date().toDateString();
  const todaysCalls = dailyStats[todayKey] || 0;
  const progress = Math.min(100, (todaysCalls / settings.dailyGoal) * 100);
  const hotLeads = leads.filter(l => l.priority === 'hot').length;
  const activeGolfCourse = useMemo(() => golfCourses.find(gc => gc.id === settings.activeGolfCourse) || null, [golfCourses, settings.activeGolfCourse]);
  const followUps = useMemo(() => leads.filter(l => l.followUp && isTodayOrPast(l.followUp)).sort((a, b) => new Date(a.followUp) - new Date(b.followUp)), [leads]);
  const overdueCount = useMemo(() => leads.filter(l => l.followUp && isOverdue(l.followUp)).length, [leads]);

  // Today's sales stats
  const todaysSales = useMemo(() => {
    const today = new Date().toDateString();
    const todaySalesList = sales.filter(s => new Date(s.saleDate).toDateString() === today);
    return {
      count: todaySalesList.reduce((sum, s) => sum + (s.saleCount || 1), 0),
      revenue: todaySalesList.reduce((sum, s) => sum + (s.amount || 0), 0),
      deals: todaySalesList.length
    };
  }, [sales]);

  // This week's sales
  const weekSales = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    
    const weekSalesList = sales.filter(s => new Date(s.saleDate) >= weekStart);
    return {
      count: weekSalesList.reduce((sum, s) => sum + (s.saleCount || 1), 0),
      revenue: weekSalesList.reduce((sum, s) => sum + (s.amount || 0), 0),
      deals: weekSalesList.length
    };
  }, [sales]);

  // Notification
  const notify = useCallback((msg) => { setNotification(msg); setTimeout(() => setNotification(''), 2500); }, []);

  // Filters
  const updateFilters = useCallback((patch) => setFilters(prev => ({ ...prev, ...patch })), []);
  const clearFilters = useCallback(() => setFilters({ golfCourseId: 'all', industry: 'all', priority: 'all', source: 'all', outcome: 'all', saleType: 'all' }), []);

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

  // Quick email log (just mark that we emailed them)
  const quickLogEmail = useCallback((lead) => {
    const now = new Date().toISOString();
    setEmails(prev => [{ 
      id: generateId(), 
      leadId: lead.id, 
      leadName: lead.businessName,
      to: lead.email || '',
      sentAt: now
    }, ...prev]);
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, lastEmailed: now, emailCount: (l.emailCount || 0) + 1 } : l));
    notify(`📧 Email logged for ${lead.businessName}`);
  }, [notify]);

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
  
  // Convert lead (sale made!)
  const convertLead = useCallback((lead, saleData = null) => {
    setLeads(prev => prev.filter(l => l.id !== lead.id));
    const convertedLead = { 
      ...lead, 
      convertedAt: new Date().toISOString(),
      status: 'converted'
    };
    setConvertedLeads(prev => [convertedLead, ...prev]);
    
    // If sale data provided, record the sale
    if (saleData) {
      const sale = {
        id: generateId(),
        leadId: lead.id,
        leadName: lead.businessName,
        saleDate: new Date().toISOString(),
        saleType: saleData.type,
        amount: saleData.amount,
        saleCount: saleData.saleCount || 1,
        notes: saleData.notes || '',
        golfCourseId: lead.golfCourseId
      };
      setSales(prev => [sale, ...prev]);
      notify(`🎉 SALE! ${lead.businessName} - $${saleData.amount}!`);
    } else {
      notify(`🎉 ${lead.businessName} converted!`);
    }
  }, [notify]);

  // Unconvert lead (sale fell through)
  const unconvertLead = useCallback((lead) => {
    setConvertedLeads(prev => prev.filter(l => l.id !== lead.id));
    setLeads(prev => [...prev, { ...lead, status: 'active', unconvertedAt: new Date().toISOString() }]);
    // Remove associated sale if exists
    setSales(prev => prev.filter(s => s.leadId !== lead.id));
    notify(`↩️ ${lead.businessName} moved back to leads`);
  }, [notify]);

  const deleteToTrash = useCallback((item, type) => {
    if (type === 'lead') setLeads(prev => prev.filter(l => l.id !== item.id));
    else if (type === 'dnc') setDncList(prev => prev.filter(l => l.id !== item.id));
    else if (type === 'dead') setDeadLeads(prev => prev.filter(l => l.id !== item.id));
    else if (type === 'converted') setConvertedLeads(prev => prev.filter(l => l.id !== item.id));
    setTrash(prev => [...prev, { ...item, type, deletedAt: new Date().toISOString() }]);
    closeModal('leadDetail');
    notify('🗑️ Moved to trash');
  }, [notify]);

  const restoreFromTrash = useCallback((item) => {
    if (item.type === 'call') { setCallLog(prev => [item, ...prev]); setDailyStats(prev => ({ ...prev, [new Date(item.timestamp).toDateString()]: (prev[new Date(item.timestamp).toDateString()] || 0) + 1 })); }
    else if (item.type === 'lead') setLeads(prev => [...prev, item]);
    else if (item.type === 'dnc') setDncList(prev => [...prev, item]);
    else if (item.type === 'dead') setDeadLeads(prev => [...prev, item]);
    else if (item.type === 'converted') setConvertedLeads(prev => [...prev, item]);
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

  // Record a sale
  const recordSale = useCallback((saleData) => {
    const sale = {
      id: generateId(),
      leadId: saleData.leadId || null,
      leadName: saleData.leadName || 'Walk-in',
      saleDate: new Date().toISOString(),
      saleType: saleData.type,
      amount: saleData.amount,
      saleCount: saleData.saleCount || 1,
      notes: saleData.notes || '',
      golfCourseId: settings.activeGolfCourse
    };
    setSales(prev => [sale, ...prev]);
    notify(`🎉 SALE recorded! $${saleData.amount}`);
    closeModal('recordSale');
    return true;
  }, [notify, settings.activeGolfCourse]);

  // Get current list with sorting
  const getCurrentList = useCallback(() => {
    const q = (searchQuery || '').toLowerCase();

    const matchesSearch = (item) => {
      if (!q) return true;
      const hay = [
        item.businessName,
        item.contactName,
        item.leadName,
        item.phone,
        item.email,
        item.website
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    };

    const matchesCommonFilters = (item) => {
      // Golf course filter applies to leads-like records, calls, and sales
      if (filters?.golfCourseId && filters.golfCourseId !== 'all') {
        if (filters.golfCourseId === 'unassigned') {
          if (item.golfCourseId) return false;
        } else if (item.golfCourseId !== filters.golfCourseId) return false;
      }

      // Lead-like filters
      if (filters?.industry && filters.industry !== 'all') {
        if ((item.industry || '') !== filters.industry) return false;
      }
      if (filters?.priority && filters.priority !== 'all') {
        if ((item.priority || 'normal') !== filters.priority) return false;
      }
      if (filters?.source && filters.source !== 'all') {
        if ((item.source || '') !== filters.source) return false;
      }

      // Call log filters
      if (filters?.outcome && filters.outcome !== 'all') {
        if ((item.outcome || '') !== filters.outcome) return false;
      }

      // Sales filters
      if (filters?.saleType && filters.saleType !== 'all') {
        if ((item.saleType || '') !== filters.saleType) return false;
      }

      return true;
    };

    const leadSorter = SORT_OPTIONS.find(s => s.key === sortBy)?.sort || SORT_OPTIONS[0].sort;

    const callSorter = (a, b) => {
      if (sortBy === 'alpha' || sortBy === 'alpha-desc') {
        return (sortBy === 'alpha')
          ? (a.leadName || '').localeCompare(b.leadName || '')
          : (b.leadName || '').localeCompare(a.leadName || '');
      }
      const ak = a.timestamp || a.callDate || a.createdAt || 0;
      const bk = b.timestamp || b.callDate || b.createdAt || 0;
      if (sortBy === 'oldest') return new Date(ak) - new Date(bk);
      return new Date(bk) - new Date(ak);
    };

    const salesSorter = (a, b) => {
      if (sortBy === 'alpha' || sortBy === 'alpha-desc') {
        return (sortBy === 'alpha')
          ? (a.leadName || '').localeCompare(b.leadName || '')
          : (b.leadName || '').localeCompare(a.leadName || '');
      }
      // Reuse "calls" sort key as "Highest Amount" in Sales view UI
      if (sortBy === 'calls') return (b.amount || 0) - (a.amount || 0);
      if (sortBy === 'oldest') return new Date(a.saleDate) - new Date(b.saleDate);
      return new Date(b.saleDate) - new Date(a.saleDate);
    };

    const trashSorter = (a, b) => {
      const ak = a.deletedAt || a.createdAt || 0;
      const bk = b.deletedAt || b.createdAt || 0;
      if (sortBy === 'oldest') return new Date(ak) - new Date(bk);
      return new Date(bk) - new Date(ak);
    };

    const applyLeadPipeline = (arr) => arr.filter(matchesSearch).filter(matchesCommonFilters).sort(leadSorter);
    const applyPlainPipeline = (arr, sorter) => arr.filter(matchesSearch).filter(matchesCommonFilters).sort(sorter);

    switch (view) {
      case 'leads': return applyLeadPipeline(leads);
      case 'followups': return applyLeadPipeline(followUps);
      case 'dnc': return applyLeadPipeline(dncList);
      case 'dead': return applyLeadPipeline(deadLeads);
      case 'converted':
        return convertedLeads
          .filter(matchesSearch)
          .filter(matchesCommonFilters)
          .sort((a, b) => {
            if (sortBy === 'oldest') return new Date(a.convertedAt) - new Date(b.convertedAt);
            if (sortBy === 'alpha' || sortBy === 'alpha-desc') {
              return (sortBy === 'alpha')
                ? (a.businessName || '').localeCompare(b.businessName || '')
                : (b.businessName || '').localeCompare(a.businessName || '');
            }
            return new Date(b.convertedAt) - new Date(a.convertedAt);
          });
      case 'calllog': return applyPlainPipeline(callLog.slice(0, 1000), callSorter).slice(0, 100);
      case 'sales': return applyPlainPipeline(sales, salesSorter);
      case 'trash': return applyPlainPipeline(trash, trashSorter);
      case 'emails':
        return emails.filter(matchesSearch);
      case 'golfcourses':
        return golfCourses.filter(gc => !q || (gc.name || '').toLowerCase().includes(q));
      default: return [];
    }
  }, [view, leads, followUps, dncList, deadLeads, convertedLeads, emails, callLog, trash, golfCourses, sales, searchQuery, sortBy, filters]);

  // Analytics
  const analytics = useMemo(() => {
    const now = new Date();
    let startDate = analyticsRange === 'week' ? new Date(now.setDate(now.getDate() - 7)) : analyticsRange === 'month' ? new Date(now.setMonth(now.getMonth() - 1)) : new Date(0);
    const filtered = callLog.filter(c => new Date(c.timestamp) >= startDate);
    const stats = Object.entries(dailyStats).filter(([d]) => new Date(d) >= startDate);
    const dailyBreakdown = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); dailyBreakdown.push({ date: d.toLocaleDateString('en-US', { weekday: 'short' }), calls: dailyStats[d.toDateString()] || 0 }); }
    
    // Sales analytics
    const filteredSales = sales.filter(s => new Date(s.saleDate) >= startDate);
    const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.amount || 0), 0);
    const totalSaleCount = filteredSales.reduce((sum, s) => sum + (s.saleCount || 1), 0);
    
    return {
      totalCalls: filtered.length,
      avgPerDay: stats.filter(([, c]) => c > 0).length > 0 ? Math.round(filtered.length / stats.filter(([, c]) => c > 0).length) : 0,
      maxDay: stats.reduce((m, [d, c]) => c > m.count ? { date: d, count: c } : m, { date: '', count: 0 }),
      outcomes: filtered.reduce((a, c) => ({ ...a, [c.outcome]: (a[c.outcome] || 0) + 1 }), {}),
      leadsContacted: new Set(filtered.filter(c => c.leadId).map(c => c.leadId)).size,
      dailyBreakdown,
      totalRevenue,
      totalSaleCount,
      salesCount: filteredSales.length,
      conversionRate: filtered.length > 0 ? ((totalSaleCount / filtered.length) * 100).toFixed(1) : 0
    };
  }, [callLog, dailyStats, analyticsRange, sales]);

  const clearAllData = useCallback(() => { if (confirm('Clear ALL data?')) { setLeads([]); setDncList([]); setDeadLeads([]); setConvertedLeads([]); setTrash([]); setEmails([]); setCallLog([]); setDailyStats({}); setSales([]); notify('🗑️ Data cleared'); } }, [notify]);

  return (
    <CRMContext.Provider value={{
      leads, dncList, deadLeads, convertedLeads, trash, emails, callLog, dailyStats, golfCourses, sales, settings, setSettings,
      view, setView, selectedIndex, setSelectedIndex, notification, searchQuery, setSearchQuery, analyticsRange, setAnalyticsRange, sortBy, setSortBy, filters, updateFilters, clearFilters,
      modals, openModal, closeModal, closeAllModals,
      todaysCalls, progress, hotLeads, activeGolfCourse, followUps, overdueCount, analytics, todaysSales, weekSales,
      notify, tallyCall, quickLogEmail, addLead, updateLead, moveToDNC, moveToDead, restoreFromDNC, restoreFromDead, 
      convertLead, unconvertLead, deleteToTrash, restoreFromTrash, emptyTrash,
      deleteCall, updateCall, addGolfCourse, updateGolfCourse, deleteGolfCourse, recordSale, getCurrentList, clearAllData,
      setLeads, setDncList, setDeadLeads, setConvertedLeads, setCallLog, setGolfCourses, setEmails, setSales
    }}>
      {children}
    </CRMContext.Provider>
  );
}

export const useCRM = () => { const ctx = useContext(CRMContext); if (!ctx) throw new Error('useCRM must be within CRMProvider'); return ctx; };
