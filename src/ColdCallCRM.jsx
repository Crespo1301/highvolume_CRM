import React, { useState, useEffect, useCallback } from 'react';

// Persistent storage helpers
const STORAGE_KEYS = {
  leads: 'crm_leads',
  dnc: 'crm_dnc',
  dead: 'crm_dead',
  stats: 'crm_stats',
  emails: 'crm_emails'
};

const loadData = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch { return defaultValue; }
};

const saveData = (key, data) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
};

// Generate unique IDs
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export default function ColdCallCRM() {
  // Core state
  const [view, setView] = useState('dashboard'); // dashboard, leads, dnc, dead, emails, addLead, addEmail
  const [todaysCalls, setTodaysCalls] = useState(() => {
    const today = new Date().toDateString();
    const stats = loadData(STORAGE_KEYS.stats, {});
    return stats[today] || 0;
  });
  const [leads, setLeads] = useState(() => loadData(STORAGE_KEYS.leads, []));
  const [dncList, setDncList] = useState(() => loadData(STORAGE_KEYS.dnc, []));
  const [deadLeads, setDeadLeads] = useState(() => loadData(STORAGE_KEYS.dead, []));
  const [emails, setEmails] = useState(() => loadData(STORAGE_KEYS.emails, []));
  
  // Form state
  const [formData, setFormData] = useState({
    businessName: '', contactName: '', phone: '', email: '', notes: '', priority: 'normal'
  });
  const [emailForm, setEmailForm] = useState({
    to: '', subject: '', body: '', leadId: ''
  });
  
  // UI state
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [notification, setNotification] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedField, setFocusedField] = useState(0);

  // Persist data on changes
  useEffect(() => {
    saveData(STORAGE_KEYS.leads, leads);
  }, [leads]);
  
  useEffect(() => {
    saveData(STORAGE_KEYS.dnc, dncList);
  }, [dncList]);
  
  useEffect(() => {
    saveData(STORAGE_KEYS.dead, deadLeads);
  }, [deadLeads]);
  
  useEffect(() => {
    saveData(STORAGE_KEYS.emails, emails);
  }, [emails]);
  
  useEffect(() => {
    const today = new Date().toDateString();
    const stats = loadData(STORAGE_KEYS.stats, {});
    stats[today] = todaysCalls;
    saveData(STORAGE_KEYS.stats, stats);
  }, [todaysCalls]);

  // Show notification
  const notify = useCallback((msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 2000);
  }, []);

  // Tally a call
  const tallyCall = useCallback(() => {
    setTodaysCalls(prev => prev + 1);
    notify(`📞 Call tallied! Total: ${todaysCalls + 1}`);
  }, [todaysCalls, notify]);

  // Get current list based on view
  const getCurrentList = useCallback(() => {
    const query = searchQuery.toLowerCase();
    const filterFn = (item) => {
      if (!query) return true;
      return (item.businessName?.toLowerCase().includes(query) ||
              item.contactName?.toLowerCase().includes(query) ||
              item.phone?.includes(query));
    };
    
    switch(view) {
      case 'leads': return leads.filter(filterFn);
      case 'dnc': return dncList.filter(filterFn);
      case 'dead': return deadLeads.filter(filterFn);
      case 'emails': return emails;
      default: return [];
    }
  }, [view, leads, dncList, deadLeads, emails, searchQuery]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't capture if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          e.target.blur();
          if (view === 'addLead' || view === 'addEmail') setView('dashboard');
        }
        if (e.key === 'Tab' && (view === 'addLead' || view === 'addEmail')) {
          e.preventDefault();
          const fields = view === 'addLead' ? 6 : 4;
          setFocusedField(prev => e.shiftKey ? (prev - 1 + fields) % fields : (prev + 1) % fields);
        }
        return;
      }

      const list = getCurrentList();
      
      switch(e.key) {
        // NUMPAD / RIGHT HAND CONTROLS
        case ' ':
        case '0':
        case 'Insert':
          e.preventDefault();
          tallyCall();
          break;
          
        case '1':
        case 'End':
          e.preventDefault();
          setView('dashboard');
          setSelectedIndex(0);
          break;
          
        case '2':
        case 'ArrowDown':
          e.preventDefault();
          if (['leads', 'dnc', 'dead', 'emails'].includes(view)) {
            setSelectedIndex(prev => Math.min(prev + 1, list.length - 1));
          }
          break;
          
        case '3':
        case 'PageDown':
          e.preventDefault();
          setView('leads');
          setSelectedIndex(0);
          break;
          
        case '4':
        case 'ArrowLeft':
          e.preventDefault();
          if (view === 'leads' && list[selectedIndex]) {
            // Mark as DNC
            const lead = list[selectedIndex];
            setLeads(prev => prev.filter(l => l.id !== lead.id));
            setDncList(prev => [...prev, { ...lead, dncDate: new Date().toISOString() }]);
            notify(`🚫 ${lead.businessName} added to DNC`);
            setSelectedIndex(prev => Math.max(0, prev - 1));
          }
          break;
          
        case '5':
          e.preventDefault();
          if (view === 'leads' && list[selectedIndex]) {
            // Quick call on selected lead
            tallyCall();
            const lead = list[selectedIndex];
            setLeads(prev => prev.map(l => 
              l.id === lead.id ? { ...l, lastCalled: new Date().toISOString(), callCount: (l.callCount || 0) + 1 } : l
            ));
            notify(`📞 Called ${lead.businessName}`);
          }
          break;
          
        case '6':
        case 'ArrowRight':
          e.preventDefault();
          if (view === 'leads' && list[selectedIndex]) {
            // Mark as dead
            const lead = list[selectedIndex];
            setLeads(prev => prev.filter(l => l.id !== lead.id));
            setDeadLeads(prev => [...prev, { ...lead, deadDate: new Date().toISOString() }]);
            notify(`💀 ${lead.businessName} marked dead`);
            setSelectedIndex(prev => Math.max(0, prev - 1));
          }
          break;
          
        case '7':
        case 'Home':
          e.preventDefault();
          setView('dnc');
          setSelectedIndex(0);
          break;
          
        case '8':
        case 'ArrowUp':
          e.preventDefault();
          if (['leads', 'dnc', 'dead', 'emails'].includes(view)) {
            setSelectedIndex(prev => Math.max(prev - 1, 0));
          }
          break;
          
        case '9':
        case 'PageUp':
          e.preventDefault();
          setView('dead');
          setSelectedIndex(0);
          break;
          
        case '+':
        case '=':
          e.preventDefault();
          setView('addLead');
          setFormData({ businessName: '', contactName: '', phone: '', email: '', notes: '', priority: 'normal' });
          setFocusedField(0);
          break;
          
        case '-':
          e.preventDefault();
          setView('emails');
          setSelectedIndex(0);
          break;
          
        case '*':
          e.preventDefault();
          setView('addEmail');
          setEmailForm({ to: '', subject: '', body: '', leadId: '' });
          setFocusedField(0);
          break;
          
        case '/':
        case '?':
          e.preventDefault();
          setShowHelp(prev => !prev);
          break;
          
        case 'Enter':
          e.preventDefault();
          if (view === 'dnc' && list[selectedIndex]) {
            // Restore from DNC
            const lead = list[selectedIndex];
            setDncList(prev => prev.filter(l => l.id !== lead.id));
            setLeads(prev => [...prev, lead]);
            notify(`✅ ${lead.businessName} restored to leads`);
            setSelectedIndex(prev => Math.max(0, prev - 1));
          } else if (view === 'dead' && list[selectedIndex]) {
            // Restore from dead
            const lead = list[selectedIndex];
            setDeadLeads(prev => prev.filter(l => l.id !== lead.id));
            setLeads(prev => [...prev, lead]);
            notify(`✅ ${lead.businessName} restored to leads`);
            setSelectedIndex(prev => Math.max(0, prev - 1));
          }
          break;
          
        case 'Delete':
        case '.':
          e.preventDefault();
          if (view === 'dnc' && list[selectedIndex]) {
            setDncList(prev => prev.filter(l => l.id !== list[selectedIndex].id));
            notify('Deleted from DNC');
            setSelectedIndex(prev => Math.max(0, prev - 1));
          } else if (view === 'dead' && list[selectedIndex]) {
            setDeadLeads(prev => prev.filter(l => l.id !== list[selectedIndex].id));
            notify('Deleted from dead leads');
            setSelectedIndex(prev => Math.max(0, prev - 1));
          } else if (view === 'emails' && list[selectedIndex]) {
            setEmails(prev => prev.filter(e => e.id !== list[selectedIndex].id));
            notify('Email deleted');
            setSelectedIndex(prev => Math.max(0, prev - 1));
          }
          break;
          
        case 'Escape':
          setShowHelp(false);
          setSearchQuery('');
          if (view === 'addLead' || view === 'addEmail') setView('dashboard');
          break;
          
        default:
          // Start search on letter keys
          if (e.key.length === 1 && e.key.match(/[a-z]/i) && ['leads', 'dnc', 'dead'].includes(view)) {
            setSearchQuery(prev => prev + e.key);
            setSelectedIndex(0);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, selectedIndex, tallyCall, getCurrentList, notify, leads]);

  // Clear search after delay
  useEffect(() => {
    if (searchQuery) {
      const timer = setTimeout(() => setSearchQuery(''), 1500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  // Focus management for forms
  useEffect(() => {
    if (view === 'addLead' || view === 'addEmail') {
      const inputs = document.querySelectorAll('.form-input');
      if (inputs[focusedField]) {
        inputs[focusedField].focus();
      }
    }
  }, [view, focusedField]);

  // Submit new lead
  const submitLead = () => {
    if (!formData.businessName || !formData.phone) {
      notify('❌ Business name and phone required');
      return;
    }
    const newLead = {
      id: generateId(),
      ...formData,
      createdAt: new Date().toISOString(),
      callCount: 0
    };
    setLeads(prev => [newLead, ...prev]);
    notify(`✅ ${formData.businessName} added!`);
    setView('leads');
    setSelectedIndex(0);
  };

  // Submit email
  const submitEmail = () => {
    if (!emailForm.to || !emailForm.subject) {
      notify('❌ To and subject required');
      return;
    }
    const newEmail = {
      id: generateId(),
      ...emailForm,
      sentAt: new Date().toISOString(),
      status: 'pending'
    };
    setEmails(prev => [newEmail, ...prev]);
    notify(`📧 Email to ${emailForm.to} saved!`);
    setView('emails');
    setSelectedIndex(0);
  };

  // Calculate stats
  const callsRemaining = Math.max(0, 200 - todaysCalls);
  const progress = Math.min(100, (todaysCalls / 200) * 100);
  const hotLeads = leads.filter(l => l.priority === 'hot').length;
  const followUps = leads.filter(l => l.followUp && new Date(l.followUp) <= new Date()).length;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#e8e8e8',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Notification Toast */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #00d4aa 0%, #00a080 100%)',
          color: '#000',
          padding: '16px 24px',
          borderRadius: '8px',
          fontWeight: 'bold',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease',
          boxShadow: '0 8px 32px rgba(0, 212, 170, 0.3)'
        }}>
          {notification}
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #0a0a0f 100%)',
            border: '2px solid #00d4aa',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '700px',
            width: '90%',
            boxShadow: '0 0 60px rgba(0, 212, 170, 0.2)'
          }}>
            <h2 style={{ 
              color: '#00d4aa', 
              marginBottom: '24px', 
              fontSize: '24px',
              borderBottom: '1px solid #333',
              paddingBottom: '12px'
            }}>
              ⌨️ KEYBOARD CONTROLS (Right Hand)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <h3 style={{ color: '#ffd700', marginBottom: '12px' }}>NUMPAD / NAVIGATION</h3>
                <div style={{ lineHeight: 1.8, fontSize: '14px' }}>
                  <div><span style={{ color: '#00d4aa' }}>SPACE / 0</span> — Tally Call</div>
                  <div><span style={{ color: '#00d4aa' }}>1 / End</span> — Dashboard</div>
                  <div><span style={{ color: '#00d4aa' }}>3 / PgDn</span> — Leads List</div>
                  <div><span style={{ color: '#00d4aa' }}>7 / Home</span> — DNC List</div>
                  <div><span style={{ color: '#00d4aa' }}>9 / PgUp</span> — Dead Leads</div>
                  <div><span style={{ color: '#00d4aa' }}>↑↓ / 8,2</span> — Navigate List</div>
                </div>
              </div>
              <div>
                <h3 style={{ color: '#ffd700', marginBottom: '12px' }}>LEAD ACTIONS</h3>
                <div style={{ lineHeight: 1.8, fontSize: '14px' }}>
                  <div><span style={{ color: '#00d4aa' }}>5</span> — Call Selected + Tally</div>
                  <div><span style={{ color: '#00d4aa' }}>← / 4</span> — Mark as DNC</div>
                  <div><span style={{ color: '#00d4aa' }}>→ / 6</span> — Mark as Dead</div>
                  <div><span style={{ color: '#00d4aa' }}>Enter</span> — Restore Lead</div>
                  <div><span style={{ color: '#00d4aa' }}>Del / .</span> — Delete Entry</div>
                  <div><span style={{ color: '#00d4aa' }}>+</span> — Add New Lead</div>
                  <div><span style={{ color: '#00d4aa' }}>*</span> — Compose Email</div>
                  <div><span style={{ color: '#00d4aa' }}>-</span> — Email List</div>
                  <div><span style={{ color: '#00d4aa' }}>/</span> — Toggle Help</div>
                </div>
              </div>
            </div>
            <p style={{ marginTop: '20px', color: '#888', fontSize: '13px', textAlign: 'center' }}>
              Press ESC or / to close • Type letters to search lists
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #333'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #00d4aa, #00a8ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '4px'
          }}>
            COLD CALL CRM
          </h1>
          <p style={{ color: '#666', fontSize: '12px' }}>Press / for keyboard shortcuts</p>
        </div>
        
        {/* Call Counter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>TODAY'S CALLS</div>
            <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#00d4aa', lineHeight: 1 }}>
              {todaysCalls}
            </div>
          </div>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: `conic-gradient(#00d4aa ${progress}%, #1a1a2e ${progress}%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(0, 212, 170, 0.2)'
          }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: '#0a0a0f',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{callsRemaining}</div>
              <div style={{ fontSize: '10px', color: '#888' }}>to goal</div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div style={{
        height: '8px',
        background: '#1a1a2e',
        borderRadius: '4px',
        marginBottom: '24px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: progress >= 100 
            ? 'linear-gradient(90deg, #00d4aa, #ffd700)' 
            : 'linear-gradient(90deg, #00d4aa, #00a8ff)',
          transition: 'width 0.3s ease',
          boxShadow: '0 0 20px rgba(0, 212, 170, 0.5)'
        }} />
      </div>

      {/* Navigation Tabs */}
      <nav style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        {[
          { key: 'dashboard', label: '1 Dashboard', count: null },
          { key: 'leads', label: '3 Leads', count: leads.length },
          { key: 'dnc', label: '7 DNC', count: dncList.length },
          { key: 'dead', label: '9 Dead', count: deadLeads.length },
          { key: 'emails', label: '- Emails', count: emails.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setView(tab.key); setSelectedIndex(0); }}
            style={{
              padding: '10px 20px',
              background: view === tab.key 
                ? 'linear-gradient(135deg, #00d4aa 0%, #00a080 100%)' 
                : '#1a1a2e',
              color: view === tab.key ? '#000' : '#888',
              border: view === tab.key ? 'none' : '1px solid #333',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '14px',
              fontWeight: view === tab.key ? 'bold' : 'normal',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label} {tab.count !== null && <span style={{ opacity: 0.7 }}>({tab.count})</span>}
          </button>
        ))}
        <button
          onClick={() => { setView('addLead'); setFormData({ businessName: '', contactName: '', phone: '', email: '', notes: '', priority: 'normal' }); }}
          style={{
            padding: '10px 20px',
            background: '#ffd700',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '14px',
            fontWeight: 'bold',
            marginLeft: 'auto'
          }}
        >
          + Add Lead
        </button>
      </nav>

      {/* Search Indicator */}
      {searchQuery && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ffd700',
          color: '#000',
          padding: '8px 24px',
          borderRadius: '20px',
          fontWeight: 'bold',
          zIndex: 100
        }}>
          🔍 {searchQuery}
        </div>
      )}

      {/* Main Content */}
      <main>
        {/* Dashboard View */}
        {view === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Quick Stats */}
            <div style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #333'
            }}>
              <h3 style={{ color: '#00d4aa', marginBottom: '20px', fontSize: '16px' }}>📊 TODAY'S STATS</h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888' }}>Calls Made</span>
                  <span style={{ color: '#00d4aa', fontWeight: 'bold', fontSize: '20px' }}>{todaysCalls}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888' }}>Daily Goal</span>
                  <span style={{ fontWeight: 'bold', fontSize: '20px' }}>200</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888' }}>Progress</span>
                  <span style={{ 
                    color: progress >= 100 ? '#ffd700' : '#00d4aa', 
                    fontWeight: 'bold',
                    fontSize: '20px'
                  }}>
                    {progress.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Lead Stats */}
            <div style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #333'
            }}>
              <h3 style={{ color: '#ffd700', marginBottom: '20px', fontSize: '16px' }}>🎯 LEAD STATUS</h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888' }}>Active Leads</span>
                  <span style={{ fontWeight: 'bold', fontSize: '20px' }}>{leads.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888' }}>Hot Leads 🔥</span>
                  <span style={{ color: '#ff6b6b', fontWeight: 'bold', fontSize: '20px' }}>{hotLeads}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888' }}>DNC List</span>
                  <span style={{ color: '#ff9f43', fontWeight: 'bold', fontSize: '20px' }}>{dncList.length}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #333'
            }}>
              <h3 style={{ color: '#00a8ff', marginBottom: '20px', fontSize: '16px' }}>⚡ QUICK ACTIONS</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <button
                  onClick={tallyCall}
                  style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, #00d4aa 0%, #00a080 100%)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  📞 TALLY CALL (SPACE)
                </button>
                <button
                  onClick={() => setView('addLead')}
                  style={{
                    padding: '12px',
                    background: '#1a1a2e',
                    color: '#ffd700',
                    border: '1px solid #ffd700',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '14px'
                  }}
                >
                  + NEW LEAD (+)
                </button>
              </div>
            </div>

            {/* Recent Leads */}
            <div style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #333',
              gridColumn: 'span 1'
            }}>
              <h3 style={{ color: '#888', marginBottom: '16px', fontSize: '16px' }}>📋 RECENT LEADS</h3>
              {leads.slice(0, 5).map((lead, i) => (
                <div key={lead.id} style={{
                  padding: '12px',
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  borderRadius: '6px',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>
                      {lead.priority === 'hot' && '🔥 '}{lead.businessName}
                    </span>
                    <span style={{ color: '#888', fontSize: '12px' }}>
                      {lead.callCount || 0} calls
                    </span>
                  </div>
                  <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                    {lead.phone}
                  </div>
                </div>
              ))}
              {leads.length === 0 && (
                <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                  No leads yet. Press + to add one!
                </p>
              )}
            </div>
          </div>
        )}

        {/* List Views (Leads, DNC, Dead) */}
        {['leads', 'dnc', 'dead'].includes(view) && (
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
            borderRadius: '16px',
            border: '1px solid #333',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 24px',
              background: 'rgba(0,0,0,0.3)',
              borderBottom: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '18px', color: '#00d4aa' }}>
                {view === 'leads' && '🎯 Active Leads'}
                {view === 'dnc' && '🚫 Do Not Call List'}
                {view === 'dead' && '💀 Dead Leads'}
              </h2>
              <span style={{ color: '#888', fontSize: '14px' }}>
                {view === 'leads' && '← DNC | → Dead | 5 Call'}
                {view === 'dnc' && 'Enter to Restore | Del to Remove'}
                {view === 'dead' && 'Enter to Restore | Del to Remove'}
              </span>
            </div>
            
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {getCurrentList().map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    padding: '16px 24px',
                    background: index === selectedIndex 
                      ? 'linear-gradient(90deg, rgba(0, 212, 170, 0.2), transparent)' 
                      : 'transparent',
                    borderLeft: index === selectedIndex ? '4px solid #00d4aa' : '4px solid transparent',
                    borderBottom: '1px solid #222',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setSelectedIndex(index)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                        {item.priority === 'hot' && <span style={{ color: '#ff6b6b' }}>🔥 </span>}
                        {item.businessName}
                      </div>
                      <div style={{ color: '#888', fontSize: '13px' }}>
                        {item.contactName && <span>{item.contactName} • </span>}
                        {item.phone}
                        {item.email && <span> • {item.email}</span>}
                      </div>
                      {item.notes && (
                        <div style={{ color: '#666', fontSize: '12px', marginTop: '6px', fontStyle: 'italic' }}>
                          {item.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {view === 'leads' && (
                        <>
                          <div style={{ color: '#00d4aa', fontSize: '14px', fontWeight: 'bold' }}>
                            {item.callCount || 0} calls
                          </div>
                          {item.lastCalled && (
                            <div style={{ color: '#666', fontSize: '11px', marginTop: '2px' }}>
                              Last: {new Date(item.lastCalled).toLocaleDateString()}
                            </div>
                          )}
                        </>
                      )}
                      {view === 'dnc' && item.dncDate && (
                        <div style={{ color: '#ff9f43', fontSize: '12px' }}>
                          Added: {new Date(item.dncDate).toLocaleDateString()}
                        </div>
                      )}
                      {view === 'dead' && item.deadDate && (
                        <div style={{ color: '#ff6b6b', fontSize: '12px' }}>
                          Died: {new Date(item.deadDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {getCurrentList().length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  {searchQuery ? `No results for "${searchQuery}"` : 'No entries yet'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emails View */}
        {view === 'emails' && (
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
            borderRadius: '16px',
            border: '1px solid #333',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 24px',
              background: 'rgba(0,0,0,0.3)',
              borderBottom: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '18px', color: '#00a8ff' }}>📧 Email Log</h2>
              <button
                onClick={() => setView('addEmail')}
                style={{
                  padding: '8px 16px',
                  background: '#00a8ff',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 'bold'
                }}
              >
                * Compose
              </button>
            </div>
            
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {emails.map((email, index) => (
                <div
                  key={email.id}
                  style={{
                    padding: '16px 24px',
                    background: index === selectedIndex 
                      ? 'linear-gradient(90deg, rgba(0, 168, 255, 0.2), transparent)' 
                      : 'transparent',
                    borderLeft: index === selectedIndex ? '4px solid #00a8ff' : '4px solid transparent',
                    borderBottom: '1px solid #222',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedIndex(index)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{email.subject}</div>
                      <div style={{ color: '#888', fontSize: '13px' }}>To: {email.to}</div>
                    </div>
                    <div style={{ color: '#666', fontSize: '12px' }}>
                      {new Date(email.sentAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ color: '#666', fontSize: '13px', marginTop: '8px' }}>
                    {email.body.substring(0, 100)}...
                  </div>
                </div>
              ))}
              {emails.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  No emails yet. Press * to compose.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Lead Form */}
        {view === 'addLead' && (
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
            borderRadius: '16px',
            border: '1px solid #ffd700',
            padding: '32px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <h2 style={{ color: '#ffd700', marginBottom: '24px', fontSize: '20px' }}>➕ Add New Lead</h2>
            <p style={{ color: '#888', marginBottom: '24px', fontSize: '13px' }}>
              Tab to navigate fields • Enter to save • Esc to cancel
            </p>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              {[
                { key: 'businessName', label: 'Business Name *', placeholder: 'Acme Corp' },
                { key: 'contactName', label: 'Contact Name', placeholder: 'John Smith' },
                { key: 'phone', label: 'Phone *', placeholder: '555-123-4567' },
                { key: 'email', label: 'Email', placeholder: 'john@acme.com' },
              ].map((field, i) => (
                <div key={field.key}>
                  <label style={{ display: 'block', color: '#888', marginBottom: '6px', fontSize: '13px' }}>
                    {field.label}
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    value={formData[field.key]}
                    onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                    onFocus={() => setFocusedField(i)}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#0a0a0f',
                      border: focusedField === i ? '2px solid #00d4aa' : '1px solid #333',
                      borderRadius: '8px',
                      color: '#e8e8e8',
                      fontFamily: 'inherit',
                      fontSize: '15px',
                      outline: 'none'
                    }}
                  />
                </div>
              ))}
              
              <div>
                <label style={{ display: 'block', color: '#888', marginBottom: '6px', fontSize: '13px' }}>
                  Priority
                </label>
                <select
                  className="form-input"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  onFocus={() => setFocusedField(4)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#0a0a0f',
                    border: focusedField === 4 ? '2px solid #00d4aa' : '1px solid #333',
                    borderRadius: '8px',
                    color: '#e8e8e8',
                    fontFamily: 'inherit',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                >
                  <option value="normal">Normal</option>
                  <option value="hot">🔥 Hot Lead</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', color: '#888', marginBottom: '6px', fontSize: '13px' }}>
                  Notes
                </label>
                <textarea
                  className="form-input"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  onFocus={() => setFocusedField(5)}
                  placeholder="Any relevant notes..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#0a0a0f',
                    border: focusedField === 5 ? '2px solid #00d4aa' : '1px solid #333',
                    borderRadius: '8px',
                    color: '#e8e8e8',
                    fontFamily: 'inherit',
                    fontSize: '15px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={submitLead}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'linear-gradient(135deg, #00d4aa 0%, #00a080 100%)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Save Lead
              </button>
              <button
                onClick={() => setView('dashboard')}
                style={{
                  padding: '14px 24px',
                  background: 'transparent',
                  color: '#888',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '16px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Add Email Form */}
        {view === 'addEmail' && (
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
            borderRadius: '16px',
            border: '1px solid #00a8ff',
            padding: '32px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <h2 style={{ color: '#00a8ff', marginBottom: '24px', fontSize: '20px' }}>📧 Compose Email</h2>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#888', marginBottom: '6px', fontSize: '13px' }}>To *</label>
                <input
                  className="form-input"
                  type="email"
                  value={emailForm.to}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, to: e.target.value }))}
                  onFocus={() => setFocusedField(0)}
                  placeholder="john@example.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#0a0a0f',
                    border: focusedField === 0 ? '2px solid #00a8ff' : '1px solid #333',
                    borderRadius: '8px',
                    color: '#e8e8e8',
                    fontFamily: 'inherit',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', color: '#888', marginBottom: '6px', fontSize: '13px' }}>Subject *</label>
                <input
                  className="form-input"
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                  onFocus={() => setFocusedField(1)}
                  placeholder="Following up on our call"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#0a0a0f',
                    border: focusedField === 1 ? '2px solid #00a8ff' : '1px solid #333',
                    borderRadius: '8px',
                    color: '#e8e8e8',
                    fontFamily: 'inherit',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', color: '#888', marginBottom: '6px', fontSize: '13px' }}>Body</label>
                <textarea
                  className="form-input"
                  value={emailForm.body}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, body: e.target.value }))}
                  onFocus={() => setFocusedField(2)}
                  placeholder="Hi, I wanted to follow up..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#0a0a0f',
                    border: focusedField === 2 ? '2px solid #00a8ff' : '1px solid #333',
                    borderRadius: '8px',
                    color: '#e8e8e8',
                    fontFamily: 'inherit',
                    fontSize: '15px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={submitEmail}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'linear-gradient(135deg, #00a8ff 0%, #0080cc 100%)',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Save Email
              </button>
              <button
                onClick={() => setView('dashboard')}
                style={{
                  padding: '14px 24px',
                  background: 'transparent',
                  color: '#888',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '16px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: '32px',
        paddingTop: '16px',
        borderTop: '1px solid #222',
        display: 'flex',
        justifyContent: 'space-between',
        color: '#666',
        fontSize: '12px'
      }}>
        <span>Press / for keyboard help</span>
        <span>Data saved locally in browser</span>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        * { box-sizing: border-box; }
        
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #0a0a0f;
        }
        ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
    </div>
  );
}
