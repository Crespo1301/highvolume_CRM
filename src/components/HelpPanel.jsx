import React from 'react';
import { Link } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { colors, buttonBase } from '../utils/theme.jsx';

const shortcuts = [
  ['Navigation', [['1', 'Dashboard'], ['3', 'Leads'], ['O', 'Outreach'], ['F', 'Follow-ups'], ['C', 'Calls'], ['$', 'Sales']]],
  ['More Nav', [['V', 'Converted'], ['7', 'DNC'], ['9', 'Dead'], ['G', 'Markets'], ['T', 'Trash'], ['A', 'Analytics'], ['-', 'Emails']]],
  ['Actions', [['SPACE', 'Manual tally'], ['E', 'Open email draft'], ['Enter', 'Open lead'], ['Left', 'Move to DNC'], ['Right', 'Move to Dead'], ['.', 'Delete'], ['+', 'Add Lead']]],
  ['Workflow', [['I', 'Import leads'], ['X', 'Export data'], ['S', 'Settings'], ['/', 'Help'], ['Esc', 'Close modal']]]
];

export function EnhancedHelpModal() {
  const { modals, closeModal } = useCRM();
  if (!modals.help) return null;

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
      onClick={() => closeModal('help')}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: colors.bgLight, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 28, maxWidth: 860, width: '90%', maxHeight: '85vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: colors.primary, fontSize: 20 }}>Help & Keyboard Shortcuts</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/tutorial" onClick={() => closeModal('help')} style={{ ...buttonBase, background: colors.primary, color: '#fff', textDecoration: 'none' }}>
              Open Tutorial
            </Link>
            <button onClick={() => closeModal('help')} style={{ ...buttonBase, background: colors.bgCard, color: colors.text }}>Close</button>
          </div>
        </div>

        <div style={{ background: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16, marginBottom: 20, display: 'grid', gap: 10 }}>
          <div style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>Recommended daily workflow</div>
          <div style={{ color: colors.textMuted, fontSize: 13 }}>1. Import from Google Places, Facebook, CSV, or JSON.</div>
          <div style={{ color: colors.textMuted, fontSize: 13 }}>2. Run enrichment to improve website status, location data, priority, and outreach angle.</div>
          <div style={{ color: colors.textMuted, fontSize: 13 }}>3. Work the Outreach queue, generate audits, draft emails, and log calls or sent emails as activity happens.</div>
          <div style={{ color: colors.textMuted, fontSize: 13 }}>4. Use Follow-ups, Emails, and Recent Audits to stay consistent through the day.</div>
          <div style={{ color: colors.textMuted, fontSize: 13 }}>5. On mobile, use the app tabs and buttons normally. Desktop shortcuts remain the fastest option.</div>
        </div>

        <div className="help-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 20 }}>
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
      </div>
    </div>
  );
}
