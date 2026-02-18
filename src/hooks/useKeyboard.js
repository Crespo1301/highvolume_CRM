import { useEffect } from 'react';
import { useCRM } from '../context/CRMContext';

export function useKeyboard() {
  const {
    view, setView, selectedIndex, setSelectedIndex, setSearchQuery,
    modals, openModal, closeAllModals,
    getCurrentList, tallyCall, moveToDNC, moveToDead, restoreFromDNC, restoreFromDead,
    restoreFromTrash, unconvertLead, deleteToTrash, deleteCall, quickLogEmail, setEmails, notify
  } = useCRM();

  useEffect(() => {
    const handle = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        if (e.key === 'Escape') { e.target.blur(); closeAllModals(); if (['addLead'].includes(view)) setView('dashboard'); }
        return;
      }
      if (e.key === 'Escape') { closeAllModals(); setSearchQuery(''); if (['addLead'].includes(view)) setView('dashboard'); return; }

      const list = getCurrentList();
      const key = e.key.toLowerCase();

      // Navigation shortcuts
      const nav = { 
        '1': 'dashboard', 
        '3': 'leads', 
        '7': 'dnc', 
        '9': 'dead', 
        'f': 'followups', 
        'c': 'calllog', 
        'g': 'golfcourses', 
        't': 'trash', 
        'a': 'analytics', 
        '-': 'emails',
        'v': 'converted',
        '$': 'sales'
      };
      if (nav[key]) { e.preventDefault(); setView(nav[key]); setSelectedIndex(0); return; }

      switch (key) {

        case 'n':
          e.preventDefault();
          if (['leads', 'followups'].includes(view) && list[selectedIndex]) { 
            setSelectedIndex(i => Math.min(i + 1, list.length - 1)); 
          }
          break;
        case 's':
          // Open Settings
          e.preventDefault();
          openModal('settings', true);
          break;
          break;
        case ' ': case '0': 
          e.preventDefault(); 
          tallyCall(['leads', 'followups'].includes(view) && list[selectedIndex] ? list[selectedIndex] : null); 
          break;
        case '2': case 'arrowdown': 
          e.preventDefault(); 
          setSelectedIndex(i => Math.min(i + 1, list.length - 1)); 
          break;
        case '8': case 'arrowup': 
          e.preventDefault(); 
          setSelectedIndex(i => Math.max(i - 1, 0)); 
          break;
        case '4': case 'arrowleft': 
          e.preventDefault(); 
          if (['leads', 'followups'].includes(view) && list[selectedIndex]) { 
            moveToDNC(list[selectedIndex]); 
            setSelectedIndex(i => Math.max(0, i - 1)); 
          } 
          break;
        case '6': case 'arrowright': 
          e.preventDefault(); 
          if (['leads', 'followups'].includes(view) && list[selectedIndex]) { 
            moveToDead(list[selectedIndex]); 
            setSelectedIndex(i => Math.max(0, i - 1)); 
          } 
          break;
        case '5': 
          e.preventDefault(); 
          if (['leads', 'followups'].includes(view) && list[selectedIndex]) openModal('leadDetail', list[selectedIndex]); 
          else if (view === 'golfcourses' && list[selectedIndex]) openModal('editGolfCourse', list[selectedIndex]); 
          break;
        case 'e':
          e.preventDefault();
          // Quick email for selected lead
          if (['leads', 'followups'].includes(view) && list[selectedIndex] && list[selectedIndex].email) {
            quickLogEmail(list[selectedIndex]);
          }
          break;
        case 'enter':
          e.preventDefault();
          if (view === 'dnc' && list[selectedIndex]) { restoreFromDNC(list[selectedIndex]); setSelectedIndex(i => Math.max(0, i - 1)); }
          else if (view === 'dead' && list[selectedIndex]) { restoreFromDead(list[selectedIndex]); setSelectedIndex(i => Math.max(0, i - 1)); }
          else if (view === 'trash' && list[selectedIndex]) { restoreFromTrash(list[selectedIndex]); setSelectedIndex(i => Math.max(0, i - 1)); }
          else if (view === 'converted' && list[selectedIndex]) { unconvertLead(list[selectedIndex]); setSelectedIndex(i => Math.max(0, i - 1)); }
          else if (['leads', 'followups'].includes(view) && list[selectedIndex]) openModal('leadDetail', list[selectedIndex]);
          else if (view === 'calllog' && list[selectedIndex]) openModal('editCall', list[selectedIndex]);
          break;
        case 'delete': case '.':
          e.preventDefault();
          if (['dnc', 'dead', 'leads', 'converted'].includes(view) && list[selectedIndex]) { 
            deleteToTrash(list[selectedIndex], view === 'leads' ? 'lead' : view); 
            setSelectedIndex(i => Math.max(0, i - 1)); 
          }
          else if (view === 'calllog' && list[selectedIndex]) { deleteCall(list[selectedIndex].id); setSelectedIndex(i => Math.max(0, i - 1)); }
          else if (view === 'emails' && list[selectedIndex]) { setEmails(p => p.filter(x => x.id !== list[selectedIndex].id)); notify('Deleted'); setSelectedIndex(i => Math.max(0, i - 1)); }
          break;
        case '+': case '=': e.preventDefault(); setView('addLead'); break;
        case '/': case '?': e.preventDefault(); openModal('help', !modals.help); break;
        case 'i': e.preventDefault(); openModal('import'); break;
        case 'x': e.preventDefault(); openModal('export'); break;
        case 's': e.preventDefault(); openModal('settings'); break;
        default: 
          if (key.match(/^[h-oq-ru-wyz]$/) && ['leads', 'followups', 'dnc', 'dead'].includes(view)) { 
            setSearchQuery(q => q + key); 
            setSelectedIndex(0); 
          }
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [view, selectedIndex, getCurrentList, modals.help]);

  // Clear search
  const { searchQuery } = useCRM();
  useEffect(() => { if (searchQuery) { const t = setTimeout(() => setSearchQuery(''), 1500); return () => clearTimeout(t); } }, [searchQuery]);
}