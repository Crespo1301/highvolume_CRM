import React from 'react';
import { useCRM } from '../context/CRMContext';
import { colors, buttonBase } from '../utils/theme.jsx';

export function Navigation() {
  const { view, setView, setSelectedIndex, leads, dncList, deadLeads, convertedLeads, callLog, golfCourses, trash, emails, followUps, overdueCount, sales } = useCRM();

  const tabs = [
    { key: 'dashboard', label: '1 Dashboard' },
    { key: 'leads', label: '3 Leads', count: leads.length },
    { key: 'followups', label: 'F Follow-ups', count: followUps.length, alert: overdueCount > 0 },
    { key: 'converted', label: 'V Converted', count: convertedLeads.length },
    { key: 'dnc', label: '7 DNC', count: dncList.length },
    { key: 'dead', label: '9 Dead', count: deadLeads.length },
    { key: 'calllog', label: 'C Calls', count: callLog.length },
    { key: 'sales', label: '$ Sales', count: sales.length },
    { key: 'golfcourses', label: 'G Courses', count: golfCourses.length },
    { key: 'trash', label: 'T Trash', count: trash.length },
    { key: 'analytics', label: 'A Analytics' },
    { key: 'emails', label: '- Emails', count: emails.length },
  ];

  return (
    <nav style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => { setView(t.key); setSelectedIndex(0); }}
          style={{
            ...buttonBase,
            padding: '8px 14px',
            background: view === t.key ? colors.primary : t.alert ? colors.danger : colors.bgCard,
            color: view === t.key ? '#fff' : t.alert ? '#fff' : colors.textMuted,
            fontSize: 12
          }}
        >
          {t.label} {t.count !== undefined && <span style={{ opacity: 0.7 }}>({t.count})</span>}
        </button>
      ))}
      <button onClick={() => setView('addLead')} style={{ ...buttonBase, padding: '8px 14px', background: colors.warning, color: '#000', fontSize: 12, marginLeft: 'auto' }}>
        + Add Lead
      </button>
    </nav>
  );
}
