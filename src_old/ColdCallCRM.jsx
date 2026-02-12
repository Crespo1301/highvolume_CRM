import React from 'react';
import { CRMProvider, useCRM } from './context/CRMContext';
import { useKeyboard } from './hooks/useKeyboard';
import { colors, GlobalStyles } from './utils/theme';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { AllModals } from './components/Modals';
import { Dashboard, Analytics, ListView, GolfCoursesView, AddLeadForm, AddEmailForm } from './components/Views';

function CRMApp() {
  const { view, notification, searchQuery } = useCRM();
  
  // Initialize keyboard handler
  useKeyboard();

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
          position: 'fixed', top: 20, right: 20, 
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
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', 
          background: colors.warning, color: '#000', 
          padding: '8px 24px', borderRadius: 20, 
          fontWeight: '600', zIndex: 100, fontSize: 13 
        }}>
          🔍 {searchQuery}
        </div>
      )}

      {/* All Modals */}
      <AllModals />

      {/* Main Layout */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px' }}>
        <Header />
        <Navigation />

        <main>
          {view === 'dashboard' && <Dashboard />}
          {view === 'analytics' && <Analytics />}
          {view === 'leads' && <ListView type="leads" />}
          {view === 'followups' && <ListView type="followups" />}
          {view === 'dnc' && <ListView type="dnc" />}
          {view === 'dead' && <ListView type="dead" />}
          {view === 'calllog' && <ListView type="calllog" />}
          {view === 'trash' && <ListView type="trash" />}
          {view === 'emails' && <ListView type="emails" />}
          {view === 'golfcourses' && <GolfCoursesView />}
          {view === 'addLead' && <AddLeadForm />}
          {view === 'addEmail' && <AddEmailForm />}
        </main>

        <Footer />
      </div>

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