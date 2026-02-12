import React from 'react';
import { useCRM } from '../context/CRMContext';
import { colors, buttonBase } from '../utils/theme.jsx';

export function Header() {
  const { todaysCalls, progress, settings, activeGolfCourse, followUps, overdueCount, setView } = useCRM();
  const remaining = Math.max(0, settings.dailyGoal - todaysCalls);

  return (
    <>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${colors.border}` }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: '700', background: 'linear-gradient(90deg, #4dabf7, #69db7c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 }}>
            COLD CALL CRM
            {activeGolfCourse && <span style={{ color: colors.accent, fontSize: 14, marginLeft: 12, fontWeight: '400', WebkitTextFillColor: colors.accent }}>⛳ {activeGolfCourse.name}</span>}
          </h1>
          <p style={{ color: colors.textDim, fontSize: 12 }}>Press <span style={{ background: colors.bgCard, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>/</span> for shortcuts</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {followUps.length > 0 && (
            <button onClick={() => setView('followups')} style={{ ...buttonBase, background: overdueCount > 0 ? colors.danger : colors.warning, color: '#000', fontWeight: '600' }}>
              📅 {followUps.length} Due {overdueCount > 0 && `(${overdueCount} overdue)`}
            </button>
          )}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: colors.textDim, textTransform: 'uppercase' }}>Today</div>
            <div style={{ fontSize: 36, fontWeight: '700', color: colors.success, lineHeight: 1 }}>{todaysCalls}</div>
          </div>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: `conic-gradient(${progress >= 100 ? colors.warning : colors.success} ${progress}%, ${colors.bgCard} ${progress}%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${progress >= 100 ? 'rgba(255,212,59,0.3)' : 'rgba(105,219,124,0.3)'}` }}>
            <div style={{ width: 82, height: 82, borderRadius: '50%', background: colors.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: '700' }}>{remaining}</div>
              <div style={{ fontSize: 9, color: colors.textDim }}>to goal</div>
            </div>
          </div>
        </div>
      </header>
      <div style={{ height: 6, background: colors.bgCard, borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(progress, 100)}%`, height: '100%', background: progress >= 100 ? `linear-gradient(90deg, ${colors.warning}, ${colors.warningDark})` : `linear-gradient(90deg, ${colors.success}, ${colors.successDark})`, transition: 'width 0.3s ease' }} />
      </div>
    </>
  );
}
