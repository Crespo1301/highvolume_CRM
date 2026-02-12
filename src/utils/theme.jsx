// ============================================================================
// THEME & STYLES
// ============================================================================

export const colors = {
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

export const buttonBase = {
  padding: '10px 16px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '13px',
  fontWeight: '500',
  border: 'none',
  transition: 'all 0.2s ease'
};

export const inputBase = {
  width: '100%',
  padding: '10px 14px',
  background: colors.bg,
  border: `1px solid ${colors.border}`,
  borderRadius: '8px',
  color: colors.text,
  fontFamily: 'inherit',
  fontSize: '14px',
  outline: 'none',
};

export const GlobalStyles = () => (
  <style>{`
    * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #373a40; border-radius: 3px; }
    input:focus, textarea:focus, select:focus { border-color: #4dabf7 !important; outline: none; }
    button:hover { filter: brightness(1.1); }
    button:active { transform: scale(0.98); }
    ::selection { background: #4dabf7; color: #fff; }
  `}</style>
);
