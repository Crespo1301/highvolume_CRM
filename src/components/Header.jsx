import React from 'react';
import { useCRM } from '../context/CRMContext';
import { colors, buttonBase } from '../utils/theme.jsx';
import { IconCalendar, IconGolf, IconPlay, IconStop, IconChevronRight } from './Icons';

export function Header() {
  const { todaysCalls, progress, settings, activeGolfCourse, followUps, overdueCount, setView, view, session, startSession, stopSession, sessionNext } = useCRM();
  const remaining = Math.max(0, settings.dailyGoal - todaysCalls);

  const canSession = ['leads', 'followups'].includes(view);

  return (
    <>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${colors.border}` }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: '750', letterSpacing: 0.2, marginBottom: 6 }}>
            <span style={{ background: 'linear-gradient(90deg, #4dabf7, #69db7c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              HighVolume CRM
            </span>
            {activeGolfCourse && (
              <span style={{ color: colors.accent, fontSize: 13, marginLeft: 12, fontWeight: '500', WebkitTextFillColor: colors.accent }}>
                <IconGolf size={14} style={{ marginRight: 6 }} /> {activeGolfCourse.name}
              </span>
            )}
          </h1>
          <p style={{ color: colors.textDim, fontSize: 12 }}>
            Press <span style={{ background: colors.bgCard, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>/</span> for shortcuts •
            <span style={{ marginLeft: 8, fontFamily: 'monospace', color: colors.textDim }}>N</span> next •
            <span style={{ marginLeft: 8, fontFamily: 'monospace', color: colors.textDim }}>S</span> session
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {followUps.length > 0 && (
            <button onClick={() => setView('followups')} style={{ ...buttonBase, background: colors.bgCard, border: `1px solid ${overdueCount > 0 ? colors.danger : colors.warning}`, color: colors.text, fontWeight: '650' }}>
              <IconCalendar size={16} style={{ marginRight: 8 }} />
              {followUps.length} Due
              {overdueCount > 0 && <span style={{ marginLeft: 8, color: colors.danger, fontWeight: 700 }}>({overdueCount} overdue)</span>}
            </button>
          )}

          {canSession && (
            session.active ? (
              <>
                <button onClick={sessionNext} style={{ ...buttonBase, background: colors.accent, color: '#001018', fontWeight: 750 }}>
                  Next <IconChevronRight size={16} style={{ marginLeft: 6 }} />
                </button>
                <button onClick={stopSession} style={{ ...buttonBase, background: colors.bgCard, border: `1px solid ${colors.border}`, color: colors.text }}>
                  <IconStop size={16} style={{ marginRight: 8 }} /> Session
                </button>
              </>
            ) : (
              <button onClick={() => startSession(view)} style={{ ...buttonBase, background: colors.bgCard, border: `1px solid ${colors.border}`, color: colors.text, fontWeight: 650 }}>
                <IconPlay size={16} style={{ marginRight: 8 }} /> Start Session
              </button>
            )
          )}

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: colors.textDim, textTransform: 'uppercase' }}>Today</div>
            <div style={{ fontSize: 34, fontWeight: '800', color: colors.success, lineHeight: 1 }}>{todaysCalls}</div>
          </div>

          <div style={{ width: 92, height: 92, borderRadius: '50%', background: `conic-gradient(${progress >= 1 ? colors.success : colors.accent} ${Math.min(progress, 1) * 360}deg, ${colors.bgCard} 0deg)`, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <div style={{ fontSize: 11, color: colors.textDim }}>Goal</div>
              <div style={{ fontSize: 18, fontWeight: '800' }}>{remaining}</div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
