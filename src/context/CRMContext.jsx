import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { STORAGE_KEYS, loadData, saveData, generateId, isTodayOrPast, isOverdue, DEFAULT_SETTINGS, SORT_OPTIONS, MARKET_PRESETS, normalizeGooglePlaceLead, normalizeFacebookLead, scoreLead, classifyPriorityFromScore, normalizeWebsiteStatus, generateOutreachAngle, generateWebsiteAudit, generateAuditSummary, generateAuditTalkingPoints, generateEmailDraft } from '../utils/helpers';

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
  const [importJobs, setImportJobs] = useState(() => loadData(STORAGE_KEYS.importJobs, []));
  const [audits, setAudits] = useState(() => loadData(STORAGE_KEYS.audits, []));

  // UI state
  const [view, setView] = useState('dashboard');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [notification, setNotification] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [analyticsRange, setAnalyticsRange] = useState('week');
  const [sortBy, setSortBy] = useState('newest');
  const [filters, setFilters] = useState(() => loadData(STORAGE_KEYS.filters, { golfCourseId: 'all', industry: 'all', priority: 'all', source: 'all', websiteStatus: 'all', outcome: 'all', saleType: 'all' }));
  const [session, setSession] = useState(() => loadData(STORAGE_KEYS.session, { active: false, view: 'leads', leadId: null }));

  // Modal state
  const [modals, setModals] = useState({
    help: false, import: false, export: false, settings: false, privacy: false, terms: false,
    leadDetail: null, editLead: null, editSale: null, editCall: null, editGolfCourse: null, recordSale: null
  });

  const openModal = (key, value = true) => setModals(m => ({ ...m, [key]: value }));
  const closeModal = (key) => setModals(m => ({ ...m, [key]: key.includes('edit') || key.includes('Detail') || key === 'recordSale' ? null : false }));
  const closeAllModals = () => setModals({ help: false, import: false, export: false, settings: false, privacy: false, terms: false, leadDetail: null, editLead: null, editSale: null, editCall: null, editGolfCourse: null, recordSale: null });

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
  useEffect(() => { saveData(STORAGE_KEYS.importJobs, importJobs); }, [importJobs]);
  useEffect(() => { saveData(STORAGE_KEYS.audits, audits); }, [audits]);
  useEffect(() => { saveData(STORAGE_KEYS.filters, filters); }, [filters]);

  // Computed values
  const todayKey = new Date().toDateString();
  const todaysCalls = dailyStats[todayKey] || 0;
  const progress = Math.min(100, (todaysCalls / settings.dailyGoal) * 100);
  const hotLeads = leads.filter(l => l.priority === 'hot').length;
  const activeGolfCourse = useMemo(() => golfCourses.find(gc => gc.id === settings.activeGolfCourse) || null, [golfCourses, settings.activeGolfCourse]);
  const followUps = useMemo(() => leads.filter(l => l.followUp && isTodayOrPast(l.followUp)).sort((a, b) => new Date(a.followUp) - new Date(b.followUp)), [leads]);
  const overdueCount = useMemo(() => leads.filter(l => l.followUp && isOverdue(l.followUp)).length, [leads]);
  const outreachReadyCount = useMemo(() => leads.filter(l => ['hot', 'normal'].includes(l.priority) && !!(l.phone || l.email)).length, [leads]);
  const recentAudits = useMemo(() => audits.slice(0, 5), [audits]);

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

  const enrichLead = useCallback((lead = {}) => {
    const normalizedLead = {
      ...lead,
      websiteStatus: normalizeWebsiteStatus(lead.websiteStatus || (lead.website ? 'outdated' : (lead.facebookUrl ? 'facebookOnly' : 'unknown'))),
    };
    const priorityScore = scoreLead(normalizedLead);
    return {
      ...normalizedLead,
      priorityScore,
      priority: classifyPriorityFromScore(priorityScore),
      outreachAngle: lead.outreachAngle || generateOutreachAngle(normalizedLead),
      outreachStatus: lead.outreachStatus || 'new',
    };
  }, []);


  // Quota & revenue goals (monthly)
  const quotaStats = useMemo(() => {
    const now = new Date();
    const ym = (settings?.quotaMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    const [yyStr, mmStr] = String(ym).split('-');
    const year = parseInt(yyStr, 10);
    const monthIndex = Math.max(0, Math.min(11, (parseInt(mmStr, 10) || (now.getMonth() + 1)) - 1));

    const monthStart = new Date(year, monthIndex, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const monthSales = (sales || []).filter(s => {
      const d = new Date(s.saleDate);
      return d >= monthStart && d < monthEnd;
    });

    const revenueSoFar = monthSales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const quota = Number(settings?.monthlyQuota) || 0;
    const remaining = Math.max(0, quota - revenueSoFar);

    const today = now;
    const isSelectedMonthCurrent = (today.getFullYear() === year && today.getMonth() === monthIndex);
    const dayOfMonth = isSelectedMonthCurrent ? today.getDate() : 1;

    // Remaining days after today (matches: day 10 of 30 -> 20 days remaining)
    const remainingDays = Math.max(0, daysInMonth - dayOfMonth);

    const dailyQuota = quota > 0 ? quota / daysInMonth : 0;
    const minimumPerDay = remainingDays > 0 ? (remaining / remainingDays) : remaining; // last day fallback

    // Monthly goal derived from weekly goal * number of weeks in month (rounded up)
    const weeksInMonth = Math.ceil(daysInMonth / 7);
    const monthlyGoalFromWeekly = (Number(settings?.weeklyRevenueGoal) || 0) * weeksInMonth;

    return {
      month: ym,
      daysInMonth,
      weeksInMonth,
      quota,
      revenueSoFar,
      remaining,
      remainingDays,
      dailyQuota,
      minimumPerDay,
      dailyRevenueGoal: Number(settings?.dailyRevenueGoal) || 0,
      weeklyRevenueGoal: Number(settings?.weeklyRevenueGoal) || 0,
      monthlyGoalFromWeekly
    };
  }, [settings?.quotaMonth, settings?.monthlyQuota, settings?.dailyRevenueGoal, settings?.weeklyRevenueGoal, sales]);
  // Filters
  const updateFilters = useCallback((patch) => setFilters(prev => ({ ...prev, ...patch })), []);
  const clearFilters = useCallback(() => setFilters({ golfCourseId: 'all', industry: 'all', priority: 'all', source: 'all', websiteStatus: 'all', outcome: 'all', saleType: 'all' }), []);

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
    notify(`Call tallied! Today: ${(dailyStats[today] || 0) + 1}`);
  }, [dailyStats, notify, settings.activeGolfCourse]);

  const getListForView = useCallback((viewName) => {
    const q = (searchQuery || '').toLowerCase();

    const matchesSearch = (item) => {
      if (!q) return true;
      const hay = [
        item.businessName,
        item.contactName,
        item.leadName,
        item.phone,
        item.email,
        item.website,
        item.address,
        item.city,
        item.region,
        item.importedFromMarket
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
      if (filters?.websiteStatus && filters.websiteStatus !== 'all') {
        if ((item.websiteStatus || 'unknown') !== filters.websiteStatus) return false;
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

    switch (viewName) {
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
      case 'outreach':
        return applyLeadPipeline(
          leads.filter(item => ['hot', 'normal'].includes(item.priority) && !!(item.phone || item.email || item.facebookUrl))
        );
      case 'emails':
        return emails.filter(matchesSearch);
      case 'golfcourses':
        return golfCourses.filter(gc => !q || (gc.name || '').toLowerCase().includes(q));
      default: return [];
    }
  }, [leads, followUps, dncList, deadLeads, convertedLeads, emails, callLog, trash, golfCourses, sales, searchQuery, sortBy, filters]);

  const getCurrentList = useCallback(() => getListForView(view), [getListForView, view]);

  const persistSession = useCallback((next) => saveData(STORAGE_KEYS.session, next), []);

  const startSession = useCallback((targetView = view) => {
    const list = getListForView(targetView);
    const current = (targetView === view && list[selectedIndex]) ? list[selectedIndex] : list[0];
    const next = { active: true, view: targetView, leadId: current?.id || null };
    setSession(next);
    persistSession(next);
    setView(targetView);
    setSelectedIndex(Math.max(0, list.findIndex(l => l.id === next.leadId)));
    notify('Session started');
  }, [getListForView, notify, persistSession, selectedIndex, setSelectedIndex, setView, view]);

  const stopSession = useCallback(() => {
    const next = { active: false, view: session.view || 'leads', leadId: null };
    setSession(next);
    persistSession(next);
    notify('Session stopped');
  }, [notify, persistSession, session.view]);

  const sessionNext = useCallback(() => {
    const list = getListForView(session.view || view);
    if (!list.length) { notify('No records in this view'); return; }
    const idx = session.leadId ? list.findIndex(l => l.id === session.leadId) : -1;
    const nextIdx = Math.min(idx + 1, list.length - 1);
    const nextLead = list[nextIdx];
    const next = { ...session, active: true, view: session.view || view, leadId: nextLead?.id || null };
    setSession(next);
    persistSession(next);
    setSelectedIndex(nextIdx);
  }, [getListForView, notify, persistSession, session, setSelectedIndex, view]);

  // Quick email log (just mark that we emailed them)
  const quickLogEmail = useCallback((lead) => {
    const now = new Date().toISOString();
    const draft = generateEmailDraft(lead);
    setEmails(prev => [{ 
      id: generateId(), 
      leadId: lead.id, 
      leadName: lead.businessName,
      to: lead.email || '',
      subject: draft.subject,
      body: draft.body,
      sentAt: now
    }, ...prev]);
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, lastEmailed: now, emailCount: (l.emailCount || 0) + 1, outreachStatus: 'contacted' } : l));
    notify(` Email logged for ${lead.businessName}`);
  }, [notify]);

  const generateLeadAudit = useCallback((lead) => {
    const now = new Date().toISOString();
    const auditMatrix = generateWebsiteAudit(lead);
    const audit = {
      id: generateId(),
      leadId: lead.id,
      leadName: lead.businessName || '',
      websiteUrl: lead.website || '',
      websiteStatus: lead.websiteStatus || 'unknown',
      summary: generateAuditSummary(lead),
      talkingPoints: generateAuditTalkingPoints(lead),
      createdAt: now,
      ...auditMatrix,
    };

    setAudits(prev => [audit, ...prev].slice(0, 200));
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, lastAuditAt: now, latestAuditSummary: audit.summary, outreachStatus: l.outreachStatus === 'new' ? 'audit_ready' : l.outreachStatus } : l));
    notify(`Audit generated for ${lead.businessName}`);
    return audit;
  }, [notify]);

  const updateOutreachStatus = useCallback((leadId, outreachStatus) => {
    setLeads(prev => prev.map(lead => lead.id === leadId ? { ...lead, outreachStatus } : lead));
    notify('Outreach status updated');
  }, [notify]);

  // Lead actions
  const addLead = useCallback((data) => {
    if (!data.businessName && !data.phone) { notify('Name or phone required'); return false; }
    setLeads(prev => [{
      id: generateId(),
      ...enrichLead(data),
      createdAt: new Date().toISOString(),
      callCount: 0,
      callHistory: [],
      golfCourseId: data.golfCourseId || settings.activeGolfCourse
    }, ...prev]);
    notify(`${data.businessName || 'Lead'} added`);
    return true;
  }, [enrichLead, notify, settings.activeGolfCourse]);

  const importGooglePlacesLeads = useCallback(async ({ marketKey, industry, maxResults = 10, golfCourseId = '' }) => {
    const market = MARKET_PRESETS.find(item => item.key === marketKey);
    if (!market) throw new Error('Choose a valid market.');

    const query = `${industry} in ${market.queryLabel}`;
    const response = await fetch('/api/google-places-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, maxResults }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || 'Unable to import leads from Google Places.');
    }

    const mappedLeads = (payload?.leads || []).map((place) => {
      const matchedMarketId =
        golfCourseId ||
        golfCourses.find(gc => (gc.name || '').toLowerCase() === (market.marketMatch || market.city).toLowerCase())?.id ||
        settings.activeGolfCourse ||
        '';

      return normalizeGooglePlaceLead(place, {
        marketKey,
        marketLabel: market.label,
        city: market.city,
        region: market.region,
        industry,
        query,
        golfCourseId: matchedMarketId,
      });
    });

    let addedCount = 0;
    let skippedCount = 0;

    setLeads(prev => {
      const existingByPlace = new Set(prev.map(lead => lead.googlePlaceId).filter(Boolean));
      const existingFallback = new Set(
        prev.map(lead => `${(lead.businessName || '').trim().toLowerCase()}|${(lead.phone || '').replace(/\D/g, '')}`)
      );

      const next = [...prev];
      for (const lead of mappedLeads) {
        const fallbackKey = `${(lead.businessName || '').trim().toLowerCase()}|${(lead.phone || '').replace(/\D/g, '')}`;
        if ((lead.googlePlaceId && existingByPlace.has(lead.googlePlaceId)) || existingFallback.has(fallbackKey)) {
          skippedCount += 1;
          continue;
        }

        next.unshift({
          ...lead,
          createdAt: new Date().toISOString(),
          callCount: 0,
          callHistory: [],
          golfCourseId: lead.golfCourseId || golfCourseId || settings.activeGolfCourse || '',
        });
        if (lead.googlePlaceId) existingByPlace.add(lead.googlePlaceId);
        existingFallback.add(fallbackKey);
        addedCount += 1;
      }

      return next;
    });

    notify(`Imported ${addedCount} lead${addedCount === 1 ? '' : 's'} from ${market.label}${skippedCount ? ` • skipped ${skippedCount} duplicates` : ''}`);
    setImportJobs(prev => [{
      id: generateId(),
      sourceType: 'google_places',
      label: `${industry} in ${market.label}`,
      createdAt: new Date().toISOString(),
      addedCount,
      skippedCount,
      marketLabel: market.label,
      golfCourseId: golfCourseId || settings.activeGolfCourse || '',
    }, ...prev].slice(0, 25));
    return { addedCount, skippedCount, query };
  }, [golfCourses, notify, settings.activeGolfCourse]);

  const importFacebookLeads = useCallback(({ data, marketKey, industry, golfCourseId = '' }) => {
    const market = MARKET_PRESETS.find(item => item.key === marketKey);
    if (!market) throw new Error('Choose a valid market.');

    const lines = String(data || '').split('\n').map(line => line.trim()).filter(Boolean);
    if (!lines.length) throw new Error('Paste at least one Facebook lead row.');

    const parsed = lines.map((line) => {
      if (line.startsWith('{')) {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }

      const parts = line.split('|').map(part => part.trim());
      if (parts.length === 1) {
        return { businessName: parts[0], facebookUrl: '' };
      }

      const [businessName, facebookUrl, phone = '', email = '', website = '', city = '', region = ''] = parts;
      return { businessName, facebookUrl, phone, email, website, city, region };
    }).filter(Boolean);

    let addedCount = 0;
    let skippedCount = 0;

    setLeads(prev => {
      const existing = new Set(
        prev.map(lead => `${(lead.businessName || '').trim().toLowerCase()}|${(lead.facebookUrl || '').trim().toLowerCase()}`)
      );
      const next = [...prev];

      for (const row of parsed) {
        const normalized = enrichLead(normalizeFacebookLead(row, {
          marketKey,
          marketLabel: market.label,
          city: row.city || market.city,
          region: row.region || market.region,
          industry,
          golfCourseId: golfCourseId || settings.activeGolfCourse || '',
        }));

        const key = `${(normalized.businessName || '').trim().toLowerCase()}|${(normalized.facebookUrl || '').trim().toLowerCase()}`;
        if (existing.has(key)) {
          skippedCount += 1;
          continue;
        }

        existing.add(key);
        next.unshift({
          ...normalized,
          createdAt: new Date().toISOString(),
          callCount: 0,
          callHistory: [],
        });
        addedCount += 1;
      }

      return next;
    });

    setImportJobs(prev => [{
      id: generateId(),
      sourceType: 'facebook',
      label: `${industry} in ${market.label}`,
      createdAt: new Date().toISOString(),
      addedCount,
      skippedCount,
      marketLabel: market.label,
      golfCourseId: golfCourseId || settings.activeGolfCourse || '',
    }, ...prev].slice(0, 25));

    notify(`Imported ${addedCount} Facebook lead${addedCount === 1 ? '' : 's'}${skippedCount ? ` • skipped ${skippedCount} duplicates` : ''}`);
    return { addedCount, skippedCount };
  }, [enrichLead, notify, settings.activeGolfCourse]);

  const enrichExistingLeads = useCallback(({ target = 'all', golfCourseId = 'all', marketKey = '' } = {}) => {
    const market = MARKET_PRESETS.find(item => item.key === marketKey);
    let updatedCount = 0;

    setLeads(prev => prev.map((lead) => {
      const matchesTarget = target === 'all'
        || (target === 'missingWebsiteStatus' && (!lead.websiteStatus || lead.websiteStatus === 'unknown'))
        || (target === 'missingLocation' && (!lead.city || !lead.region))
        || (target === 'facebookOnly' && !!lead.facebookUrl);

      const matchesMarket = golfCourseId === 'all' || lead.golfCourseId === golfCourseId;
      if (!matchesTarget || !matchesMarket) return lead;

      const nextLead = enrichLead({
        ...lead,
        city: lead.city || market?.city || lead.city,
        region: lead.region || market?.region || lead.region,
      });
      updatedCount += 1;
      return nextLead;
    }));

    setImportJobs(prev => [{
      id: generateId(),
      sourceType: 'enrichment',
      label: `Bulk enrichment${market?.label ? ` • ${market.label}` : ''}`,
      createdAt: new Date().toISOString(),
      addedCount: updatedCount,
      skippedCount: 0,
      marketLabel: market?.label || '',
      golfCourseId: golfCourseId === 'all' ? '' : golfCourseId,
    }, ...prev].slice(0, 25));

    notify(`Enriched ${updatedCount} lead${updatedCount === 1 ? '' : 's'}`);
    return { updatedCount };
  }, [enrichLead, notify]);

  const updateLead = useCallback((lead) => {
    const nextLead = enrichLead(lead);
    setLeads(prev => prev.map(l => l.id === lead.id ? nextLead : l));
    openModal('leadDetail', nextLead);
    closeModal('editLead');
    notify('Lead updated');
  }, [enrichLead, notify]);
  const moveToDNC = useCallback((lead) => { setLeads(prev => prev.filter(l => l.id !== lead.id)); setDncList(prev => [...prev, { ...lead, dncDate: new Date().toISOString() }]); notify(` ${lead.businessName} → DNC`); }, [notify]);
  const moveToDead = useCallback((lead) => { setLeads(prev => prev.filter(l => l.id !== lead.id)); setDeadLeads(prev => [...prev, { ...lead, deadDate: new Date().toISOString() }]); notify(` ${lead.businessName} → Dead`); }, [notify]);
  const restoreFromDNC = useCallback((lead) => { setDncList(prev => prev.filter(l => l.id !== lead.id)); setLeads(prev => [...prev, { ...lead, restoredAt: new Date().toISOString() }]); notify(` ${lead.businessName} restored`); }, [notify]);
  const restoreFromDead = useCallback((lead) => { setDeadLeads(prev => prev.filter(l => l.id !== lead.id)); setLeads(prev => [...prev, { ...lead, restoredAt: new Date().toISOString() }]); notify(` ${lead.businessName} restored`); }, [notify]);
  
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
      notify(` SALE! ${lead.businessName} - $${saleData.amount}!`);
    } else {
      notify(` ${lead.businessName} converted!`);
    }
  }, [notify]);

  // Unconvert lead (sale fell through)
  const unconvertLead = useCallback((lead) => {
    setConvertedLeads(prev => prev.filter(l => l.id !== lead.id));
    setLeads(prev => [...prev, { ...lead, status: 'active', unconvertedAt: new Date().toISOString() }]);
    // Remove associated sale if exists
    setSales(prev => prev.filter(s => s.leadId !== lead.id));
    notify(`️ ${lead.businessName} moved back to leads`);
  }, [notify]);

  const deleteToTrash = useCallback((item, type) => {
    if (type === 'lead') setLeads(prev => prev.filter(l => l.id !== item.id));
    else if (type === 'dnc') setDncList(prev => prev.filter(l => l.id !== item.id));
    else if (type === 'dead') setDeadLeads(prev => prev.filter(l => l.id !== item.id));
    else if (type === 'converted') setConvertedLeads(prev => prev.filter(l => l.id !== item.id));
    setTrash(prev => [...prev, { ...item, type, deletedAt: new Date().toISOString() }]);
    closeModal('leadDetail');
    notify('Moved to trash');
  }, [notify]);

  const restoreFromTrash = useCallback((item) => {
    if (item.type === 'call') { setCallLog(prev => [item, ...prev]); setDailyStats(prev => ({ ...prev, [new Date(item.timestamp).toDateString()]: (prev[new Date(item.timestamp).toDateString()] || 0) + 1 })); }
    else if (item.type === 'lead') setLeads(prev => [...prev, item]);
    else if (item.type === 'dnc') setDncList(prev => [...prev, item]);
    else if (item.type === 'dead') setDeadLeads(prev => [...prev, item]);
    else if (item.type === 'converted') setConvertedLeads(prev => [...prev, item]);
    else if (item.type === 'sale') setSales(prev => [...prev, item]);
    setTrash(prev => prev.filter(t => !(t.id === item.id && t.type === item.type)));
    notify('Restored from trash');
  }, [notify]);

  const emptyTrash = useCallback(() => { if (trash.length && confirm(`Delete ${trash.length} items permanently?`)) { setTrash([]); notify('Trash emptied'); } }, [trash, notify]);

  // Call actions
  const deleteCall = useCallback((callId) => {
    const call = callLog.find(c => c.id === callId);
    if (!call) return;
    setTrash(prev => [...prev, { ...call, type: 'call', deletedAt: new Date().toISOString() }]);
    setCallLog(prev => prev.filter(c => c.id !== callId));
    setDailyStats(prev => ({ ...prev, [new Date(call.timestamp).toDateString()]: Math.max(0, (prev[new Date(call.timestamp).toDateString()] || 1) - 1) }));
    if (call.leadId) setLeads(prev => prev.map(l => l.id === call.leadId ? { ...l, callCount: Math.max(0, (l.callCount || 1) - 1), callHistory: (l.callHistory || []).filter(h => h.id !== callId) } : l));
    notify('Call deleted');
  }, [callLog, notify]);

  const updateCall = useCallback((call) => { setCallLog(prev => prev.map(c => c.id === call.id ? call : c)); closeModal('editCall'); notify('Call updated'); }, [notify]);

  // Golf course actions
  const addGolfCourse = useCallback((data) => { if (!data.name) { notify('Name required'); return false; } setGolfCourses(prev => [...prev, { id: generateId(), ...data, createdAt: new Date().toISOString() }]); notify(' Market added'); return true; }, [notify]);
  const updateGolfCourse = useCallback((course) => { setGolfCourses(prev => prev.map(gc => gc.id === course.id ? course : gc)); closeModal('editGolfCourse'); notify('Market updated'); }, [notify]);
  const deleteGolfCourse = useCallback((id) => { if (confirm('Delete market?')) { setGolfCourses(prev => prev.filter(gc => gc.id !== id)); if (settings.activeGolfCourse === id) setSettings(prev => ({ ...prev, activeGolfCourse: null })); notify('Market deleted'); } }, [settings.activeGolfCourse, notify]);

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
    notify(` SALE recorded! $${saleData.amount}`);
    closeModal('recordSale');
    return true;
  }, [notify, settings.activeGolfCourse]);

  
  // Update an existing sale (edit)
  const updateSale = useCallback((updated) => {
    if (!updated?.id) return false;
    setSales(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
    notify('Sale updated');
    closeModal('editSale');
    return true;
  }, [notify]);

  // Delete sale (moves to Trash for audit/history)
  const deleteSale = useCallback((sale) => {
    if (!sale?.id) return false;
    setSales(prev => prev.filter(s => s.id !== sale.id));
    setTrash(prev => [...prev, { ...sale, type: 'sale', deletedAt: new Date().toISOString() }]);
    notify('Sale moved to trash');
    closeModal('editSale');
    return true;
  }, [notify]);

// Get current list with sorting



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
    const filteredEmails = emails.filter(e => new Date(e.sentAt) >= startDate);
    const filteredAudits = audits.filter(a => new Date(a.createdAt) >= startDate);
    
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
      conversionRate: filtered.length > 0 ? ((totalSaleCount / filtered.length) * 100).toFixed(1) : 0,
      emailsSent: filteredEmails.length,
      auditsGenerated: filteredAudits.length
    };
  }, [callLog, dailyStats, analyticsRange, sales, emails, audits]);

  const clearAllData = useCallback(() => { if (confirm('Clear ALL data?')) { setLeads([]); setDncList([]); setDeadLeads([]); setConvertedLeads([]); setTrash([]); setEmails([]); setCallLog([]); setDailyStats({}); setSales([]); setAudits([]); notify('Data cleared'); } }, [notify]);

  return (
    <CRMContext.Provider value={{
      leads, dncList, deadLeads, convertedLeads, trash, emails, callLog, dailyStats, golfCourses, sales, settings, setSettings, audits,
      view, setView, selectedIndex, setSelectedIndex, notification, searchQuery, setSearchQuery, analyticsRange, setAnalyticsRange, sortBy, setSortBy, filters, updateFilters, clearFilters, session, startSession, stopSession, sessionNext,
      modals, openModal, closeModal, closeAllModals,
      todaysCalls, progress, hotLeads, activeGolfCourse, followUps, overdueCount, analytics, todaysSales, weekSales, quotaStats, outreachReadyCount, recentAudits,
      importJobs, setImportJobs,
      notify, tallyCall, quickLogEmail, addLead, updateLead, moveToDNC, moveToDead, restoreFromDNC, restoreFromDead, 
      importGooglePlacesLeads, importFacebookLeads, enrichExistingLeads, generateLeadAudit, updateOutreachStatus,
      convertLead, unconvertLead, deleteToTrash, restoreFromTrash, emptyTrash,
      deleteCall, updateCall, addGolfCourse, updateGolfCourse, deleteGolfCourse, recordSale, updateSale, deleteSale, getCurrentList, clearAllData,
      setLeads, setDncList, setDeadLeads, setConvertedLeads, setCallLog, setGolfCourses, setEmails, setSales
    }}>
      {children}
    </CRMContext.Provider>
  );
}

export const useCRM = () => { const ctx = useContext(CRMContext); if (!ctx) throw new Error('useCRM must be within CRMProvider'); return ctx; };
