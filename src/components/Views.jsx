import React, { useState, useRef } from 'react';
import { useCRM } from '../context/CRMContext';
import { colors, buttonBase, inputBase } from '../utils/theme.jsx';
import { formatDate, formatDateTime, formatDateForInput, formatDateDisplay, isOverdue, INDUSTRIES, SOURCES, parseDateInput, SORT_OPTIONS, SALE_TYPES } from '../utils/helpers';
import { IconPlay, IconStop, IconChevronRight, IconPhone, IconCalendar, IconCheck, IconBan, IconSkull, IconFlag } from './Icons';

// Card component
const Card = ({ title, color, borderColor, children }) => (
  <div style={{ background: colors.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${borderColor || colors.border}` }}>
    <h3 style={{ color, marginBottom: 16, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
    {children}
  </div>
);

const Stat = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
    <span style={{ color: colors.textMuted }}>{label}</span>
    <span style={{ color: color || colors.text, fontWeight: '700', fontSize: 20 }}>{value}</span>
  </div>
);

// Clickable Date Input - opens calendar when clicking anywhere
const DateInput = ({ value, onChange, label }) => {
  const inputRef = useRef(null);
  const displayValue = value ? formatDateDisplay(value) : '';
  
  return (
    <div>
      <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>{label}</label>
      <div 
        onClick={() => inputRef.current?.showPicker?.() || inputRef.current?.focus()}
        style={{ ...inputBase, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <span style={{ color: displayValue ? colors.text : colors.textDim }}>
          {displayValue || 'Click to select date'}
        </span>
        <span style={{ color: colors.textDim }}></span>
        <input
          ref={inputRef}
          type="date"
          value={formatDateForInput(value)}
          onChange={e => onChange(parseDateInput(e.target.value))}
          style={{ 
            position: 'absolute', 
            opacity: 0, 
            width: 0, 
            height: 0,
            pointerEvents: 'none'
          }}
        />
      </div>
    </div>
  );
};

// Dashboard

function Pill({ label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 999, fontSize: 12, background: colors.bg, border: `1px solid ${colors.border}`, color: colors.textDim }}>
      {label}
    </span>
  );
}

export function Dashboard() {
  const { todaysCalls, settings, progress, leads, hotLeads, followUps, analytics, tallyCall, setView, openModal, activeGolfCourse, todaysSales, weekSales, convertedLeads } = useCRM();

  const priorityCounts = React.useMemo(() => {
    const counts = { hot: 0, normal: 0, low: 0 };
    (leads || []).forEach(l => {
      const p = (l.priority || 'normal');
      if (p === 'hot') counts.hot += 1;
      else if (p === 'low') counts.low += 1;
      else counts.normal += 1;
    });
    return counts;
  }, [leads]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
      <Card title=" Today" color={colors.success}>
        <Stat label="Calls" value={todaysCalls} color={colors.success} />
        <Stat label="Goal" value={settings.dailyGoal} />
        <Stat label="Progress" value={`${progress.toFixed(0)}%`} color={progress >= 100 ? colors.warning : colors.success} />
      </Card>

      <Card title=" Sales Today" color={colors.warning} borderColor={todaysSales.count >= settings.dailySalesGoal ? colors.success : colors.border}>
        <Stat label="Sales" value={todaysSales.count} color={todaysSales.count >= settings.dailySalesGoal ? colors.success : colors.warning} />
        <Stat label="Revenue" value={`$${todaysSales.revenue.toLocaleString()}`} color={colors.success} />
        <Stat label="Goal" value={`${settings.dailySalesGoal}/day`} />
      </Card>

      <Card title=" This Week" color={colors.accent}>
        <Stat label="Sales" value={weekSales.count} color={colors.accent} />
        <Stat label="Revenue" value={`$${weekSales.revenue.toLocaleString()}`} color={colors.success} />
        <Stat label="Converted" value={convertedLeads.length} />
      </Card>

      <Card title=" Leads" color={colors.primary}>
        <Stat label="Active" value={leads.length} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(255,107,107,0.12)', border: `1px solid rgba(255,107,107,0.25)`, color: colors.danger, fontSize: 12, fontWeight: 650 }}>
            Hot: {priorityCounts.hot}
          </span>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(77,171,247,0.10)', border: `1px solid rgba(77,171,247,0.20)`, color: colors.accent, fontSize: 12, fontWeight: 650 }}>
            Normal: {priorityCounts.normal}
          </span>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(160,174,192,0.12)', border: `1px solid rgba(160,174,192,0.22)`, color: colors.textMuted, fontSize: 12, fontWeight: 650 }}>
            Low: {priorityCounts.low}
          </span>
        </div>
        <div style={{ marginTop: 10 }}>
          <Stat label="Follow-ups" value={followUps.length} color={followUps.length > 0 ? colors.warning : colors.textMuted} />
        </div>
      </Card>

      <Card title=" Quick Actions" color={colors.primary}>
        <button onClick={() => tallyCall()} style={{ ...buttonBase, width: '100%', background: colors.success, color: '#fff', fontSize: 14, marginBottom: 10 }}> Tally Call (Space)</button>
        <button onClick={() => setView('addLead')} style={{ ...buttonBase, width: '100%', background: colors.bgLight, color: colors.warning, border: `1px solid ${colors.warning}`, marginBottom: 10 }}>+ New Lead</button>
        <button onClick={() => openModal('recordSale', {})} style={{ ...buttonBase, width: '100%', background: colors.warning, color: '#000', fontWeight: '600' }}> Record Sale</button>
      </Card>

      <Card title=" Last 7 Days" color={colors.textMuted}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
          {analytics.dailyBreakdown.map((d, i) => {
            const max = Math.max(...analytics.dailyBreakdown.map(x => x.calls), 1);
            const h = (d.calls / max) * 80;
            return (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: h, background: i === 6 ? colors.success : colors.border, borderRadius: '4px 4px 0 0', minHeight: 4, marginBottom: 6 }} />
                <div style={{ fontSize: 10, color: i === 6 ? colors.success : colors.textDim }}>{d.date}</div>
                <div style={{ fontSize: 11, color: i === 6 ? colors.success : colors.textMuted, fontWeight: '600' }}>{d.calls}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {followUps.length > 0 && (
        <Card title=" Follow-ups Due" color={colors.warning} borderColor={colors.warning}>
          {followUps.slice(0, 4).map(l => (
            <div key={l.id} onClick={() => openModal('leadDetail', l)} style={{ padding: 12, background: colors.bgLight, borderRadius: 8, marginBottom: 8, cursor: 'pointer', borderLeft: `3px solid ${isOverdue(l.followUp) ? colors.danger : colors.warning}` }}>
              <div style={{ fontWeight: '600', fontSize: 13 }}>{l.businessName}</div>
              <div style={{ color: isOverdue(l.followUp) ? colors.danger : colors.textMuted, fontSize: 11 }}>{formatDate(l.followUp)} {isOverdue(l.followUp) && '(OVERDUE)'}</div>
            </div>
          ))}
          {followUps.length > 4 && <button onClick={() => setView('followups')} style={{ ...buttonBase, width: '100%', background: 'transparent', color: colors.warning, border: `1px solid ${colors.border}`, fontSize: 12 }}>View all {followUps.length} →</button>}
        </Card>
      )}

      {activeGolfCourse && (
        <Card title=" Active Course" color={colors.accent} borderColor={colors.accent}>
          <div style={{ fontWeight: '600', fontSize: 16, marginBottom: 8 }}>{activeGolfCourse.name}</div>
          {activeGolfCourse.address && <div style={{ color: colors.textMuted, fontSize: 13 }}>{activeGolfCourse.address}</div>}
          {activeGolfCourse.phone && <div style={{ color: colors.textMuted, fontSize: 13 }}>{activeGolfCourse.phone}</div>}
        </Card>
      )}
    </div>
  );
}

// Analytics
export function Analytics() {
  const { analytics, analyticsRange, setAnalyticsRange } = useCRM();

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {['week', 'month', 'all'].map(r => (
          <button key={r} onClick={() => setAnalyticsRange(r)} style={{ ...buttonBase, background: analyticsRange === r ? colors.primary : colors.bgCard, color: analyticsRange === r ? '#fff' : colors.textMuted, fontSize: 12 }}>
            {r === 'week' ? '7 Days' : r === 'month' ? '30 Days' : 'All Time'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
        {[
          ['Total Calls', analytics.totalCalls, colors.success],
          ['Avg/Day', analytics.avgPerDay, colors.primary],
          ['Leads Contacted', analytics.leadsContacted, colors.warning],
          ['Best Day', analytics.maxDay.count, colors.danger],
          ['Sales', analytics.totalSaleCount, colors.accent],
          ['Revenue', `$${analytics.totalRevenue.toLocaleString()}`, colors.success],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: colors.bgCard, padding: 20, borderRadius: 12, textAlign: 'center', border: `1px solid ${colors.border}` }}>
            <div style={{ color, fontSize: 32, fontWeight: '700' }}>{val}</div>
            <div style={{ color: colors.textMuted, fontSize: 12 }}>{label}</div>
          </div>
        ))}
      </div>

      {Object.keys(analytics.outcomes).length > 0 && (
        <div style={{ background: colors.bgCard, padding: 24, borderRadius: 12, border: `1px solid ${colors.border}` }}>
          <h3 style={{ color: colors.textMuted, marginBottom: 16, fontSize: 13, textTransform: 'uppercase' }}>Outcomes</h3>
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
    </div>
  );
}

// Sort Header
const SortHeader = ({ type }) => {
  const { sortBy, setSortBy } = useCRM();

  const OPTIONS = {
    // Leads-like
    leads: SORT_OPTIONS,
    followups: SORT_OPTIONS,
    dnc: SORT_OPTIONS,
    dead: SORT_OPTIONS,
    converted: [
      { key: 'newest', label: 'Newest First' },
      { key: 'oldest', label: 'Oldest First' },
      { key: 'alpha', label: 'A → Z' },
      { key: 'alpha-desc', label: 'Z → A' },
    ],
    calllog: [
      { key: 'newest', label: 'Newest First' },
      { key: 'oldest', label: 'Oldest First' },
      { key: 'alpha', label: 'A → Z' },
      { key: 'alpha-desc', label: 'Z → A' },
    ],
    sales: [
      { key: 'newest', label: 'Newest First' },
      { key: 'oldest', label: 'Oldest First' },
      { key: 'alpha', label: 'A → Z' },
      { key: 'alpha-desc', label: 'Z → A' },
      { key: 'calls', label: 'Highest Amount' },
    ],
    trash: [
      { key: 'newest', label: 'Newest First' },
      { key: 'oldest', label: 'Oldest First' },
    ],
    emails: null,
    golfcourses: null,
  };

  const opts = OPTIONS[type];
  if (!opts) return null;

  const hasCurrent = opts.some(o => o.key === sortBy);
  const value = hasCurrent ? sortBy : opts[0].key;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: colors.textDim, fontSize: 11 }}>Sort:</span>
      <select 
        value={value} 
        onChange={e => setSortBy(e.target.value)}
        style={{ ...inputBase, width: 'auto', padding: '4px 8px', fontSize: 11, background: colors.bg }}
      >
        {opts.map(opt => (
          <option key={opt.key} value={opt.key}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};

// Filter Header
const FilterHeader = ({ type }) => {
  const { filters, updateFilters, clearFilters, golfCourses } = useCRM();

  // Only show on list views (not dashboard/analytics/addLead/golfcourses)
  if (['golfcourses', 'emails'].includes(type)) return null;

  const hasAny = Object.values(filters || {}).some(v => v && v !== 'all');

  const showLeadFilters = ['leads', 'followups', 'dnc', 'dead', 'converted', 'trash'].includes(type);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
      {/* Golf course filter */}
      <select
        value={filters.golfCourseId || 'all'}
        onChange={e => updateFilters({ golfCourseId: e.target.value })}
        style={{ ...inputBase, width: 'auto', padding: '4px 8px', fontSize: 11, background: colors.bg }}
        title="Filter by golf course"
      >
        <option value="all">All Courses</option>
        <option value="unassigned">Unassigned</option>
        {golfCourses.map(gc => <option key={gc.id} value={gc.id}>{gc.name}</option>)}
      </select>

      {showLeadFilters && (
        <>
          <select
            value={filters.industry || 'all'}
            onChange={e => updateFilters({ industry: e.target.value })}
            style={{ ...inputBase, width: 'auto', padding: '4px 8px', fontSize: 11, background: colors.bg }}
            title="Filter by industry"
          >
            <option value="all">All Industries</option>
            {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
          </select>

          <select
            value={filters.priority || 'all'}
            onChange={e => updateFilters({ priority: e.target.value })}
            style={{ ...inputBase, width: 'auto', padding: '4px 8px', fontSize: 11, background: colors.bg }}
            title="Filter by priority"
          >
            <option value="all">All Priorities</option>
            <option value="hot"> Hot</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filters.source || 'all'}
            onChange={e => updateFilters({ source: e.target.value })}
            style={{ ...inputBase, width: 'auto', padding: '4px 8px', fontSize: 11, background: colors.bg }}
            title="Filter by source"
          >
            <option value="all">All Sources</option>
            {SOURCES.map(src => <option key={src} value={src}>{src}</option>)}
          </select>
        </>
      )}

      {type === 'calllog' && (
        <select
          value={filters.outcome || 'all'}
          onChange={e => updateFilters({ outcome: e.target.value })}
          style={{ ...inputBase, width: 'auto', padding: '4px 8px', fontSize: 11, background: colors.bg }}
          title="Filter by call outcome"
        >
          <option value="all">All Outcomes</option>
          {['completed', 'voicemail', 'no-answer', 'callback', 'interested', 'not-interested'].map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      )}

      {type === 'sales' && (
        <select
          value={filters.saleType || 'all'}
          onChange={e => updateFilters({ saleType: e.target.value })}
          style={{ ...inputBase, width: 'auto', padding: '4px 8px', fontSize: 11, background: colors.bg }}
          title="Filter by sale type"
        >
          <option value="all">All Sale Types</option>
          {SALE_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      )}

      {hasAny && (
        <button onClick={clearFilters} style={{ ...buttonBase, padding: '6px 10px', background: colors.bgCard, color: colors.textMuted, fontSize: 11 }}>
          Clear Filters
        </button>
      )}
    </div>
  );
};

// List View (leads, dnc, dead, calllog, trash, emails, converted, sales)
export function ListView({ type }) {
  const { view, getCurrentList, selectedIndex, setSelectedIndex, openModal, restoreFromTrash, restoreFromDNC, restoreFromDead, unconvertLead, emptyTrash, trash, quickLogEmail, session, startSession, stopSession, sessionNext, tallyCall, updateLead, convertLead, moveToDNC, moveToDead, notify } = useCRM();
  const list = getCurrentList();

  const titles = { 
    leads: 'Active Leads',
    followups: 'Follow-ups',
    dnc: 'Do Not Call',
    dead: 'Dead Leads',
    converted: 'Converted',
    calllog: 'Call Log',
    sales: 'Sales',
    trash: 'Trash',
    emails: 'Email Log',
    golfcourses: 'Golf Courses'
  };
  
  const hints = { 
    leads: 'E = Email | ← DNC | → Dead | Space Call', 
    followups: 'E = Email | ← DNC | → Dead | Space Call',
    dnc: 'Enter to restore', 
    dead: 'Enter to restore',
    converted: 'Enter to unconvert',
    calllog: 'Enter to edit',
    trash: 'Enter to restore'
  };

  return (
    <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', background: colors.bgLight, borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: 15, color: colors.text, fontWeight: '600' }}>{titles[type]}</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <SortHeader type={type} />
          <FilterHeader type={type} />
          {hints[type] && <span style={{ color: colors.textDim, fontSize: 11 }}>{hints[type]}</span>}
          <span style={{ color: colors.textDim, fontSize: 12 }}>{list.length} entries</span>
          {type === 'trash' && trash.length > 0 && (
            <button onClick={emptyTrash} style={{ ...buttonBase, padding: '6px 12px', background: colors.danger, color: '#fff', fontSize: 11 }}>Empty Trash</button>
          )}
        </div>

      {session?.active && ['leads', 'followups'].includes(type) && (
        <div style={{ marginBottom: 14, padding: 14, borderRadius: 14, background: colors.bgCard, border: `1px solid ${colors.border}`, boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontSize: 12, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Dial Session • {type === 'followups' ? 'Follow-ups' : 'Leads'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={sessionNext} style={{ ...buttonBase, background: colors.accent, color: '#001018', fontWeight: 750 }}>
                Next <IconChevronRight size={16} style={{ marginLeft: 6 }} />
              </button>
              <button onClick={stopSession} style={{ ...buttonBase, background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
                <IconStop size={16} style={{ marginRight: 8 }} /> Stop
              </button>
            </div>
          </div>

          {(() => {
            const lead = (session.leadId ? list.find(l => l.id === session.leadId) : null) || list[selectedIndex];
            if (!lead) return <div style={{ marginTop: 12, color: colors.textDim }}>No leads match your current filters.</div>;

            const setFollowUpDays = (days) => {
              const dt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
              const iso = dt.toISOString();
              updateLead({ ...lead, followUp: iso });
              notify(`Follow-up scheduled in ${days} day${days === 1 ? '' : 's'}`);
              sessionNext();
            };

            return (
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lead.businessName || lead.contactName || 'Lead'}
                    </div>
                    {lead.phone && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'monospace', fontSize: 12, padding: '4px 8px', borderRadius: 999, background: colors.bg, border: `1px solid ${colors.border}` }}>
                        <IconPhone size={14} /> {lead.phone}
                      </div>
                    )}
                    {lead.followUp && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '4px 8px', borderRadius: 999, background: colors.bg, border: `1px solid ${colors.border}` }}>
                        <IconCalendar size={14} /> {new Date(lead.followUp).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {lead.industry && <Pill label={lead.industry} />}
                    {lead.priority && <Pill label={lead.priority} />}
                    {lead.source && <Pill label={lead.source} />}
                  </div>

                  {lead.notes && (
                    <div style={{ marginTop: 10, color: colors.text, fontSize: 13, opacity: 0.9, whiteSpace: 'pre-wrap' }}>
                      {lead.notes}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 240 }}>
                  <button onClick={() => tallyCall(lead, 'completed', '')} style={{ ...buttonBase, background: colors.success, color: '#001018', fontWeight: 800 }}>
                    <IconPhone size={16} style={{ marginRight: 8 }} /> Log Call
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button onClick={() => setFollowUpDays(2)} style={{ ...buttonBase, background: colors.warning, color: '#001018', fontWeight: 800 }}>
                      <IconFlag size={16} style={{ marginRight: 8 }} /> Follow-up
                    </button>
                    <button onClick={() => { convertLead(lead); sessionNext(); }} style={{ ...buttonBase, background: colors.accent, color: '#001018', fontWeight: 800 }}>
                      <IconCheck size={16} style={{ marginRight: 8 }} /> Converted
                    </button>
                    <button onClick={() => { moveToDNC(lead); sessionNext(); }} style={{ ...buttonBase, background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: 750 }}>
                      <IconBan size={16} style={{ marginRight: 8 }} /> DNC
                    </button>
                    <button onClick={() => { moveToDead(lead); sessionNext(); }} style={{ ...buttonBase, background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: 750 }}>
                      <IconSkull size={16} style={{ marginRight: 8 }} /> Dead
                    </button>
                  </div>

                  <button onClick={() => openModal('editLead', lead)} style={{ ...buttonBase, background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
                    Edit Lead
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
      </div>
      <div style={{ maxHeight: 500, overflowY: 'auto' }}>
        {list.map((item, idx) => (
          <div 
            key={item.id + (item.type || '')} 
            onClick={() => {
              setSelectedIndex(idx);
              if (type === 'calllog') openModal('editCall', item);
              else if (type === 'trash') restoreFromTrash(item);
              else if (type === 'sales') { /* just select */ }
              else if (type !== 'emails' && type !== 'dnc' && type !== 'dead' && type !== 'converted') openModal('leadDetail', item);
            }} 
            style={{ 
              padding: '14px 20px', 
              background: idx === selectedIndex ? `${colors.primary}15` : 'transparent', 
              borderLeft: idx === selectedIndex ? `3px solid ${colors.primary}` : '3px solid transparent', 
              borderBottom: `1px solid ${colors.border}`, 
              cursor: 'pointer' 
            }}
          >
            {type === 'sales' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: 14 }}>{item.leadName}</div>
                  <div style={{ color: colors.textMuted, fontSize: 12 }}>{item.saleType} • {formatDate(item.saleDate)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: colors.success, fontSize: 18, fontWeight: '700' }}>${item.amount?.toLocaleString()}</div>
                  <div style={{ color: colors.textDim, fontSize: 11 }}>{item.saleCount} sale{item.saleCount > 1 ? 's' : ''}</div>
                </div>
              </div>
            ) : type === 'calllog' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div><div style={{ fontWeight: '600', fontSize: 14 }}>{item.leadName}</div><div style={{ color: colors.textMuted, fontSize: 12 }}>{item.phone}</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ color: colors.success, fontSize: 12 }}>{item.outcome}</div><div style={{ color: colors.textDim, fontSize: 11 }}>{formatDateTime(item.timestamp)}</div></div>
              </div>
            ) : type === 'trash' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontWeight: '600', fontSize: 14 }}>{item.businessName || item.leadName}</div><div style={{ color: colors.textMuted, fontSize: 12 }}>Type: {item.type}</div></div>
                <span style={{ color: colors.success, fontSize: 12 }}>Click to restore</span>
              </div>
            ) : type === 'emails' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div><div style={{ fontWeight: '600', fontSize: 14 }}>{item.leadName || item.to}</div></div>
                <div style={{ color: colors.textDim, fontSize: 11 }}>{formatDateTime(item.sentAt)}</div>
              </div>
            ) : type === 'converted' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: '600' }}> {item.businessName}</div>
                  <div style={{ color: colors.textMuted, fontSize: 12 }}>{item.contactName && `${item.contactName} • `}{item.phone}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ color: colors.success, fontSize: 11 }}>Converted: {formatDate(item.convertedAt)}</div>
                  <button onClick={(e) => { e.stopPropagation(); unconvertLead(item); }} style={{ ...buttonBase, padding: '6px 12px', background: colors.warning, color: '#000', fontSize: 11 }}>↩ Unconvert</button>
                </div>
              </div>
            ) : type === 'dnc' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: '600' }}>{item.businessName}</div>
                  <div style={{ color: colors.textMuted, fontSize: 12 }}>{item.contactName && `${item.contactName} • `}{item.phone}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ color: colors.warning, fontSize: 11 }}>DNC: {formatDate(item.dncDate)}</div>
                  <button onClick={(e) => { e.stopPropagation(); restoreFromDNC(item); }} style={{ ...buttonBase, padding: '6px 12px', background: colors.success, color: '#fff', fontSize: 11 }}>↩ Restore</button>
                </div>
              </div>
            ) : type === 'dead' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: '600' }}>{item.businessName}</div>
                  <div style={{ color: colors.textMuted, fontSize: 12 }}>{item.contactName && `${item.contactName} • `}{item.phone}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ color: colors.danger, fontSize: 11 }}>Dead: {formatDate(item.deadDate)}</div>
                  <button onClick={(e) => { e.stopPropagation(); restoreFromDead(item); }} style={{ ...buttonBase, padding: '6px 12px', background: colors.success, color: '#fff', fontSize: 11 }}>↩ Restore</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: '600' }}>
                    {item.priority === 'hot' && ' '}{item.businessName}
                    {item.industry && <span style={{ color: colors.textDim, fontSize: 11, marginLeft: 8 }}>({item.industry})</span>}
                  </div>
                  <div style={{ color: colors.textMuted, fontSize: 12 }}>{item.contactName && `${item.contactName} • `}{item.phone}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {item.email && (
                    <button onClick={(e) => { e.stopPropagation(); quickLogEmail(item); }} style={{ ...buttonBase, padding: '4px 8px', background: colors.primary, color: '#fff', fontSize: 10 }}>📧</button>
                  )}
                  <div style={{ textAlign: 'right' }}>
                    {['leads', 'followups'].includes(type) && <div style={{ color: colors.success, fontSize: 13, fontWeight: '600' }}>{item.callCount || 0} calls</div>}
                    {item.followUp && <div style={{ color: isOverdue(item.followUp) ? colors.danger : colors.textDim, fontSize: 11 }}> {formatDate(item.followUp)}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: colors.textDim }}>No entries</div>}
      </div>
    </div>
  );
}

// Golf Courses View
export function GolfCoursesView() {
  const { golfCourses, settings, setSettings, openModal, addGolfCourse, notify, selectedIndex, setSelectedIndex } = useCRM();
  const [form, setForm] = useState({ name: '', address: '', phone: '', contactName: '', email: '', region: '', notes: '' });

  const handleAdd = () => {
    if (addGolfCourse(form)) setForm({ name: '', address: '', phone: '', contactName: '', email: '', region: '', notes: '' });
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ background: colors.bgCard, borderRadius: 12, padding: 20, border: `1px solid ${colors.accent}` }}>
        <h3 style={{ color: colors.accent, marginBottom: 16, fontSize: 14, fontWeight: '600' }}> Add Golf Course</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {['name', 'address', 'phone', 'contactName', 'email', 'region'].map(key => (
            <input key={key} placeholder={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1') + (key === 'name' ? ' *' : '')} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inputBase} />
          ))}
        </div>
        <button onClick={handleAdd} style={{ ...buttonBase, marginTop: 12, background: colors.accent, color: '#fff' }}>Add Course</button>
      </div>

      <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', background: colors.bgLight, borderBottom: `1px solid ${colors.border}` }}>
          <h2 style={{ fontSize: 15, color: colors.text, fontWeight: '600' }}> Golf Courses ({golfCourses.length})</h2>
        </div>
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {golfCourses.map((gc, idx) => (
            <div key={gc.id} onClick={() => { setSelectedIndex(idx); openModal('editGolfCourse', gc); }} style={{ padding: '14px 20px', background: settings.activeGolfCourse === gc.id ? `${colors.accent}20` : idx === selectedIndex ? `${colors.primary}15` : 'transparent', borderLeft: settings.activeGolfCourse === gc.id ? `3px solid ${colors.accent}` : '3px solid transparent', borderBottom: `1px solid ${colors.border}`, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: 14 }}>{gc.name} {settings.activeGolfCourse === gc.id && <span style={{ color: colors.accent, fontSize: 11 }}>✓ Active</span>}</div>
                  <div style={{ color: colors.textMuted, fontSize: 12 }}>{gc.address} {gc.region && `• ${gc.region}`}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); setSettings(p => ({ ...p, activeGolfCourse: gc.id })); notify(` ${gc.name} set as active`); }} style={{ ...buttonBase, padding: '6px 12px', background: settings.activeGolfCourse === gc.id ? colors.bgLight : colors.accent, color: settings.activeGolfCourse === gc.id ? colors.textMuted : '#fff', fontSize: 11 }}>
                  {settings.activeGolfCourse === gc.id ? 'Active' : 'Set Active'}
                </button>
              </div>
            </div>
          ))}
          {golfCourses.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: colors.textDim }}>No courses yet</div>}
        </div>
      </div>
    </div>
  );
}

// Add Lead Form
export function AddLeadForm() {
  const { addLead, setView, golfCourses, settings } = useCRM();
  const [form, setForm] = useState({ 
    businessName: '', 
    contactName: '', 
    phone: '', 
    email: '', 
    address: '', 
    website: '', 
    industry: 'Restaurant',
    notes: '', 
    priority: 'normal', 
    source: 'Google Maps',
    followUp: '', 
    golfCourseId: settings.activeGolfCourse || ''
  });

  const handleSubmit = () => { if (addLead(form)) { setView('leads'); } };

  return (
    <div style={{ background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.warning}`, padding: 28, maxWidth: 700, margin: '0 auto' }}>
      <h2 style={{ color: colors.warning, marginBottom: 20, fontSize: 18, fontWeight: '600' }}>➕ Add New Lead</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[
          ['businessName', 'Business Name *', 2], 
          ['contactName', 'Contact', 1], 
          ['phone', 'Phone *', 1],
          ['email', 'Email', 1], 
          ['website', 'Website', 1], 
          ['address', 'Address', 2],
        ].map(([key, label, span]) => (
          <div key={key} style={{ gridColumn: `span ${span}` }}>
            <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>{label}</label>
            <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inputBase} />
          </div>
        ))}
        
        <div>
          <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Industry</label>
          <select value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} style={inputBase}>
            {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Source</label>
          <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} style={inputBase}>
            {SOURCES.map(src => <option key={src} value={src}>{src}</option>)}
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Priority</label>
          <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={inputBase}>
            <option value="normal">Normal</option>
            <option value="hot"> Hot</option>
            <option value="low">Low</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Golf Course {settings.activeGolfCourse && '(default: active)'}</label>
          <select value={form.golfCourseId} onChange={e => setForm(f => ({ ...f, golfCourseId: e.target.value }))} style={inputBase}>
            <option value="">None</option>
            {golfCourses.map(gc => <option key={gc.id} value={gc.id}>{gc.name} {gc.id === settings.activeGolfCourse ? '✓' : ''}</option>)}
          </select>
        </div>
        
        <DateInput 
          value={form.followUp} 
          onChange={val => setForm(f => ({ ...f, followUp: val }))} 
          label="Follow-up Date"
        />
        
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', color: colors.textMuted, marginBottom: 4, fontSize: 12 }}>Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...inputBase, resize: 'vertical' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button onClick={handleSubmit} style={{ ...buttonBase, flex: 1, background: colors.success, color: '#fff', fontSize: 14 }}>Save Lead</button>
        <button onClick={() => setView('dashboard')} style={{ ...buttonBase, background: colors.bgLight, color: colors.textMuted }}>Cancel</button>
      </div>
    </div>
  );
}

// Sales View
export function SalesView() {
  const { sales, openModal, weekSales, todaysSales, settings } = useCRM();
  
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <Card title=" Today" color={colors.warning}>
          <Stat label="Sales" value={todaysSales.count} color={todaysSales.count >= settings.dailySalesGoal ? colors.success : colors.text} />
          <Stat label="Revenue" value={`$${todaysSales.revenue.toLocaleString()}`} color={colors.success} />
        </Card>
        <Card title=" This Week" color={colors.accent}>
          <Stat label="Sales" value={weekSales.count} color={colors.accent} />
          <Stat label="Revenue" value={`$${weekSales.revenue.toLocaleString()}`} color={colors.success} />
        </Card>
        <Card title=" Quick Add" color={colors.primary}>
          <button onClick={() => openModal('recordSale', {})} style={{ ...buttonBase, width: '100%', background: colors.warning, color: '#000', fontWeight: '600' }}> Record Sale</button>
        </Card>
      </div>
      
      <ListView type="sales" />
    </div>
  );
}