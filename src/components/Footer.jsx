import React from 'react';
import { useCRM } from '../context/CRMContext';
import { colors } from '../utils/theme.jsx';

export function Footer() {
  const { openModal } = useCRM();

  return (
    <footer style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${colors.border}` }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ color: colors.textDim, fontSize: 12 }}>
            © 2026 <a href="https://carloscrespo.info" target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, textDecoration: 'none' }}>Carlos Crespo</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
            <button onClick={() => openModal('privacy')} style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>Privacy</button>
            <button onClick={() => openModal('terms')} style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>Terms</button>
            <button onClick={() => openModal('settings')} style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>Settings</button>
            <a href="https://github.com/Crespo1301" target="_blank" rel="noopener noreferrer" style={{ color: colors.textMuted, textDecoration: 'none' }}>GitHub</a>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ color: colors.textDim, fontSize: 11 }}>
            <Shortcut k="/" label="Help" />
            <Shortcut k="F" label="Follow-ups" />
            <Shortcut k="G" label="Courses" />
            <Shortcut k="T" label="Trash" />
            <Shortcut k="I" label="Import" />
            <Shortcut k="E" label="Export" last />
          </div>
          <div style={{ color: colors.textDim, fontSize: 11 }}>Data saved locally in browser</div>
        </div>
      </div>
    </footer>
  );
}

const Shortcut = ({ k, label, last }) => (
  <span style={{ marginRight: last ? 0 : 16 }}>
    <span style={{ background: colors.bgCard, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{k}</span> {label}
  </span>
);
