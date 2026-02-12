// ============================================================================
// STORAGE & UTILITIES
// ============================================================================

export const STORAGE_KEYS = {
  leads: 'crm_leads',
  dnc: 'crm_dnc',
  dead: 'crm_dead',
  trash: 'crm_trash',
  stats: 'crm_stats',
  emails: 'crm_emails',
  callLog: 'crm_call_log',
  settings: 'crm_settings',
  golfCourses: 'crm_golf_courses'
};

export const loadData = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) { return defaultValue; }
};

export const saveData = (key, data) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* ignore */ }
};

export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString() : '';
export const formatDateTime = (dateStr) => dateStr ? new Date(dateStr).toLocaleString() : '';

// Fix timezone issue - use local date parts instead of UTC
export const formatDateForInput = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Parse date input without timezone shift
export const parseDateInput = (dateStr) => {
  if (!dateStr) return '';
  // Input is YYYY-MM-DD, store as noon local time to avoid day shifts
  return `${dateStr}T12:00:00`;
};

export const isOverdue = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  d.setHours(23, 59, 59);
  return d < new Date();
};

export const isTodayOrPast = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  d.setHours(23, 59, 59);
  return d <= new Date();
};

export const DEFAULT_SETTINGS = { dailyGoal: 200, activeGolfCourse: null };

// Industry categories
export const INDUSTRIES = [
  'Restaurant',
  'Bar / Nightclub',
  'Auto Detail Service',
  'Law Firm',
  'Realtor / Real Estate',
  'Medical / Healthcare',
  'Dental Office',
  'Fitness / Gym',
  'Salon / Spa',
  'Retail Store',
  'Professional Services',
  'Construction / Trades',
  'Financial Services',
  'Insurance',
  'Tech / Software',
  'Other'
];

// Lead sources
export const SOURCES = [
  'Google Maps',
  'Referral',
  'Cold Call',
  'Website',
  'Social Media',
  'Trade Show',
  'Yelp',
  'Yellow Pages',
  'Door to Door',
  'Other'
];