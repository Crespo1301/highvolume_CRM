import React from 'react';
import { useCRM } from '../context/CRMContext';
import { colors, buttonBase } from '../utils/theme.jsx';
import { IconTarget, IconCalendar, IconCheck, IconBan, IconSkull, IconPhone, IconGolf, IconSort, IconFilter } from './Icons';

export function Navigation() {
  const { view, setView, setSelectedIndex, leads, dncList, deadLeads, convertedLeads, callLog, golfCourses, trash, emails, followUps, overdueCount, sales } = useCRM();

  
  const tabs = [
    { key: 'dashboard', label: 'Dashboard', shortcut: '1' },
    { key: 'leads', label: 'Leads', shortcut: '3', count: leads.length, icon: <IconTarget size={16} /> },
    { key: 'followups', label: 'Follow-ups', shortcut: 'F', count: followUps.length, alert: overdueCount > 0, icon: <IconCalendar size={16} /> },
    { key: 'converted', label: 'Converted', shortcut: 'V', count: convertedLeads.length, icon: <IconCheck size={16} /> },
    { key: 'dnc', label: 'DNC', shortcut: '7', count: dncList.length, icon: <IconBan size={16} /> },
    { key: 'dead', label: 'Dead', shortcut: '9', count: deadLeads.length, icon: <IconSkull size={16} /> },
    { key: 'calllog', label: 'Calls', shortcut: 'C', count: callLog.length, icon: <IconPhone size={16} /> },
    { key: 'sales', label: 'Sales', shortcut: '$', count: sales.length },
    { key: 'golfcourses', label: 'Courses', shortcut: 'G', count: golfCourses.length, icon: <IconGolf size={16} /> },
    { key: 'trash', label: 'Trash', shortcut: 'T', count: trash.length },
    { key: 'analytics', label: 'Analytics', shortcut: 'A' },
    { key: 'emails', label: 'Emails', shortcut: '-', count: emails.length },
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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {t.icon && <span style={{ opacity: 0.9 }}>{t.icon}</span>}
            <span>{t.label}</span>
            <span style={{ marginLeft: 6, fontFamily: 'monospace', fontSize: 11, opacity: 0.65 }}>{t.shortcut}</span>
            {t.count !== undefined && <span style={{ opacity: 0.7 }}>({t.count})</span>}
          </span>
        </button>
      ))}
      <button onClick={() => setView('addLead')} style={{ ...buttonBase, padding: '8px 14px', background: colors.warning, color: '#000', fontSize: 12, marginLeft: 'auto' }}>
        + Add Lead
      </button>
    </nav>
  );
}
