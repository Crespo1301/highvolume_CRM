import React from 'react';
import { CRMProvider, useCRM } from './context/CRMContext';
import { useKeyboard } from './hooks/useKeyboard';
import { colors, GlobalStyles } from './utils/theme.jsx';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { AllModals } from './components/Modals';
import { Dashboard, Analytics, ListView, GolfCoursesView, AddLeadForm, SalesView } from './components/Views';
import { IconBan, IconCalendar, IconCheck, IconDownload, IconGolf, IconHome, IconMail, IconMore, IconPhone, IconPlus, IconSettings, IconSkull, IconTarget, IconUpload, IconX } from './components/Icons';

const MOBILE_BREAKPOINT = 820;
const MOBILE_PRIMARY_VIEWS = ['dashboard', 'leads', 'followups', 'calllog', 'outreach', 'sales'];

const MOBILE_TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: IconHome },
  { key: 'leads', label: 'Leads', icon: IconTarget },
  { key: 'followups', label: 'Follow-Ups', icon: IconCalendar },
  { key: 'calllog', label: 'Calls', icon: IconPhone },
  { key: 'outreach', label: 'Outreach', icon: IconMail },
  { key: 'sales', label: 'Sales', icon: IconCheck },
];

const MOBILE_MORE_VIEWS = [
  { key: 'emails', label: 'Emails', icon: IconMail },
  { key: 'analytics', label: 'Analytics', icon: IconCheck },
  { key: 'golfcourses', label: 'Markets', icon: IconGolf },
  { key: 'converted', label: 'Converted', icon: IconCheck },
  { key: 'dnc', label: 'DNC', icon: IconBan },
  { key: 'dead', label: 'Dead', icon: IconSkull },
  { key: 'trash', label: 'Trash', icon: IconSkull },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() => (
    typeof window !== 'undefined' ? window.innerWidth <= MOBILE_BREAKPOINT : false
  ));

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return isMobile;
}

function MobileHeader({ onOpenActions, onOpenMore }) {
  const { todaysCalls, settings, activeGolfCourse, followUps, overdueCount } = useCRM();
  const remaining = Math.max(0, settings.dailyGoal - todaysCalls);

  return (
    <header className="mobile-header">
      <div className="mobile-header__top">
        <div className="mobile-header__brand">
          <img src="/carloscrespo-mark.svg" alt="Carlos Crespo Brand Mark" className="mobile-header__logo" />
          <div>
            <div className="mobile-header__title">HighVolume CRM</div>
            <div className="mobile-header__subtitle">By Carlos Crespo</div>
          </div>
        </div>
        <div className="mobile-header__buttons">
          <button className="mobile-icon-button" onClick={onOpenActions} aria-label="Open actions">
            <IconPlus size={18} />
          </button>
          <button className="mobile-icon-button" onClick={onOpenMore} aria-label="Open menu">
            <IconMore size={18} />
          </button>
        </div>
      </div>

      <div className="mobile-header__stats">
        <div className="mobile-stat-chip">
          <span>Today</span>
          <strong>{todaysCalls}</strong>
        </div>
        <div className="mobile-stat-chip">
          <span>Goal Left</span>
          <strong>{remaining}</strong>
        </div>
        <div className={`mobile-stat-chip ${overdueCount > 0 ? 'is-alert' : ''}`}>
          <span>Follow-Ups</span>
          <strong>{followUps.length}</strong>
        </div>
      </div>

      {activeGolfCourse && (
        <div className="mobile-header__market">
          <IconTarget size={14} />
          <span>{activeGolfCourse.name}</span>
        </div>
      )}
    </header>
  );
}

function MobileTabRail() {
  const { view, setView, setSelectedIndex, followUps, leads, callLog, outreachReadyCount, sales } = useCRM();
  const counts = {
    dashboard: null,
    leads: leads.length,
    followups: followUps.length,
    calllog: callLog.length,
    outreach: outreachReadyCount,
    sales: sales.length,
  };

  return (
    <div className="mobile-tab-rail" role="tablist" aria-label="Primary views">
      {MOBILE_TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = view === tab.key;
        return (
          <button
            key={tab.key}
            className={`mobile-tab-pill ${isActive ? 'is-active' : ''}`}
            onClick={() => { setView(tab.key); setSelectedIndex(0); }}
            role="tab"
            aria-selected={isActive}
          >
            <Icon size={15} />
            <span>{tab.label}</span>
            {counts[tab.key] !== null && <em>{counts[tab.key]}</em>}
          </button>
        );
      })}
    </div>
  );
}

function MobileBottomDock({ onOpenActions, onOpenMore }) {
  const { view, setView, setSelectedIndex, followUps } = useCRM();
  const dockItems = [
    { key: 'dashboard', label: 'Home', icon: IconHome, onClick: () => { setView('dashboard'); setSelectedIndex(0); } },
    { key: 'leads', label: 'Leads', icon: IconTarget, onClick: () => { setView('leads'); setSelectedIndex(0); } },
    { key: 'actions', label: 'Actions', icon: IconPlus, onClick: onOpenActions },
    { key: 'followups', label: 'Due', icon: IconCalendar, onClick: () => { setView('followups'); setSelectedIndex(0); }, badge: followUps.length || null },
    { key: 'more', label: 'More', icon: IconMore, onClick: onOpenMore },
  ];

  return (
    <div className="mobile-bottom-dock">
      {dockItems.map(item => {
        const Icon = item.icon;
        const isActive = item.key === view;
        return (
          <button
            key={item.key}
            className={`mobile-dock-button ${isActive ? 'is-active' : ''}`}
            onClick={item.onClick}
          >
            <span className="mobile-dock-button__icon">
              <Icon size={18} />
              {item.badge ? <i>{item.badge}</i> : null}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function MobileSheet({ title, open, onClose, children }) {
  return (
    <div className={`mobile-sheet ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <button className="mobile-sheet__backdrop" onClick={onClose} aria-label="Close menu" />
      <div className="mobile-sheet__panel">
        <div className="mobile-sheet__handle" />
        <div className="mobile-sheet__header">
          <strong>{title}</strong>
          <button className="mobile-icon-button" onClick={onClose} aria-label="Close">
            <IconX size={18} />
          </button>
        </div>
        <div className="mobile-sheet__content">
          {children}
        </div>
      </div>
    </div>
  );
}

function CRMApp() {
  const { view, notification, searchQuery, openModal, setView, setSelectedIndex } = useCRM();
  const isMobile = useIsMobile();
  const [mobileSheet, setMobileSheet] = React.useState(null);
  const touchStartRef = React.useRef(null);
  
  // Initialize keyboard handler
  useKeyboard();

  React.useEffect(() => {
    document.title = 'App | HighVolume CRM By Carlos Crespo'
  }, []);

  React.useEffect(() => {
    if (!isMobile) {
      setMobileSheet(null);
    }
  }, [isMobile]);

  const openActionSheet = () => setMobileSheet('actions');
  const openMoreSheet = () => setMobileSheet('more');
  const closeMobileSheet = () => setMobileSheet(null);

  const openView = (nextView) => {
    setView(nextView);
    setSelectedIndex(0);
    closeMobileSheet();
  };

  const runSheetAction = (fn) => {
    closeMobileSheet();
    fn();
  };

  const onTouchStart = (event) => {
    if (!isMobile) return;
    const touch = event.changedTouches?.[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event) => {
    if (!isMobile) return;
    const start = touchStartRef.current;
    const touch = event.changedTouches?.[0];
    touchStartRef.current = null;
    if (!start || !touch) return;

    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaY) > 42 || Math.abs(deltaX) < 64) return;

    const currentIndex = MOBILE_PRIMARY_VIEWS.indexOf(view);
    if (currentIndex === -1) return;

    const nextIndex = deltaX < 0
      ? Math.min(currentIndex + 1, MOBILE_PRIMARY_VIEWS.length - 1)
      : Math.max(currentIndex - 1, 0);

    if (nextIndex !== currentIndex) {
      openView(MOBILE_PRIMARY_VIEWS[nextIndex]);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: colors.bg, 
      color: colors.text, 
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      WebkitFontSmoothing: 'antialiased'
    }}>
      {/* Notification Toast */}
      {notification && (
        <div style={{ 
          position: 'fixed', top: isMobile ? 16 : 20, right: isMobile ? 16 : 20, left: isMobile ? 16 : 'auto',
          background: colors.bgCard, 
          color: colors.text,
          padding: '14px 20px', 
          borderRadius: 10, 
          fontWeight: '500',
          fontSize: 14,
          zIndex: 1000, 
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          border: `1px solid ${colors.border}`
        }}>
          {notification}
        </div>
      )}

      {/* Search Indicator */}
      {searchQuery && (
        <div style={{ 
          position: 'fixed', bottom: isMobile ? 92 : 20, left: '50%', transform: 'translateX(-50%)', 
          background: colors.warning, color: '#000', 
          padding: '8px 24px', borderRadius: 20, 
          fontWeight: '600', zIndex: 100, fontSize: 13 
        }}>
           {searchQuery}
        </div>
      )}

      {/* All Modals */}
      <AllModals />

      {isMobile && (
        <>
          <MobileSheet title="Quick Actions" open={mobileSheet === 'actions'} onClose={closeMobileSheet}>
            <div className="mobile-sheet-grid">
              <button className="mobile-sheet-action is-primary" onClick={() => runSheetAction(() => openView('addLead'))}>
                <IconPlus size={18} />
                <span>Add Lead</span>
              </button>
              <button className="mobile-sheet-action" onClick={() => runSheetAction(() => openView('calllog'))}>
                <IconPhone size={18} />
                <span>Calls</span>
              </button>
              <button className="mobile-sheet-action" onClick={() => runSheetAction(() => openModal('import'))}>
                <IconUpload size={18} />
                <span>Import</span>
              </button>
              <button className="mobile-sheet-action" onClick={() => runSheetAction(() => openModal('export'))}>
                <IconDownload size={18} />
                <span>Export</span>
              </button>
            </div>

            <div className="mobile-sheet-section">
              <button className="mobile-sheet-link" onClick={() => runSheetAction(() => openModal('recordSale', {}))}>
                <IconCheck size={17} />
                <span>Record Sale</span>
              </button>
              <button className="mobile-sheet-link" onClick={() => runSheetAction(() => openModal('help'))}>
                <IconMail size={17} />
                <span>Shortcuts And Help</span>
              </button>
            </div>
          </MobileSheet>

          <MobileSheet title="More" open={mobileSheet === 'more'} onClose={closeMobileSheet}>
            <div className="mobile-sheet-grid">
              {MOBILE_MORE_VIEWS.map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.key} className="mobile-sheet-action" onClick={() => openView(item.key)}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mobile-sheet-section">
              <button className="mobile-sheet-link" onClick={() => runSheetAction(() => openModal('settings'))}>
                <IconSettings size={17} />
                <span>Settings</span>
              </button>
              <button className="mobile-sheet-link" onClick={() => runSheetAction(() => openModal('help'))}>
                <IconCalendar size={17} />
                <span>Help</span>
              </button>
            </div>
          </MobileSheet>
        </>
      )}

      {/* Main Layout */}
      <div className={`app-shell ${isMobile ? 'app-shell--mobile' : ''}`} style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '16px 16px 104px' : '20px 24px' }}>
        {isMobile ? (
          <>
            <MobileHeader onOpenActions={openActionSheet} onOpenMore={openMoreSheet} />
            <MobileTabRail />
          </>
        ) : (
          <>
            <Header />
            <Navigation />
          </>
        )}

        <main className={isMobile ? 'app-main app-main--mobile' : 'app-main'} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {view === 'dashboard' && <Dashboard />}
          {view === 'analytics' && <Analytics />}
          {view === 'leads' && <ListView type="leads" />}
          {view === 'followups' && <ListView type="followups" />}
          {view === 'converted' && <ListView type="converted" />}
          {view === 'dnc' && <ListView type="dnc" />}
          {view === 'dead' && <ListView type="dead" />}
          {view === 'calllog' && <ListView type="calllog" />}
          {view === 'outreach' && <ListView type="outreach" />}
          {view === 'sales' && <SalesView />}
          {view === 'trash' && <ListView type="trash" />}
          {view === 'emails' && <ListView type="emails" />}
          {view === 'golfcourses' && <GolfCoursesView />}
          {view === 'addLead' && <AddLeadForm />}
        </main>

        <Footer />
      </div>

      {isMobile && <MobileBottomDock onOpenActions={openActionSheet} onOpenMore={openMoreSheet} />}

      <GlobalStyles />
    </div>
  );
}

export default function ColdCallCRM() {
  return (
    <CRMProvider>
      <CRMApp />
    </CRMProvider>
  );
}
