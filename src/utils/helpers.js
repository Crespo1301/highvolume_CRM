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
  golfCourses: 'crm_golf_courses',
  sales: 'crm_sales',
  converted: 'crm_converted',
  filters: 'crm_filters'
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

// Display date in readable format for forms
export const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
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

export const DEFAULT_SETTINGS = { 
  dailyGoal: 150, // Updated to 150 calls
  dailySalesGoal: 2, // 2 sales per day target
  activeGolfCourse: null 
};

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

// Sort options for leads
export const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest First', sort: (a, b) => new Date(b.createdAt) - new Date(a.createdAt) },
  { key: 'oldest', label: 'Oldest First', sort: (a, b) => new Date(a.createdAt) - new Date(b.createdAt) },
  { key: 'alpha', label: 'A → Z', sort: (a, b) => (a.businessName || '').localeCompare(b.businessName || '') },
  { key: 'alpha-desc', label: 'Z → A', sort: (a, b) => (b.businessName || '').localeCompare(a.businessName || '') },
  { key: 'followup', label: 'Follow-up Date', sort: (a, b) => {
    if (!a.followUp && !b.followUp) return 0;
    if (!a.followUp) return 1;
    if (!b.followUp) return -1;
    return new Date(a.followUp) - new Date(b.followUp);
  }},
  { key: 'calls', label: 'Most Calls', sort: (a, b) => (b.callCount || 0) - (a.callCount || 0) },
  { key: 'industry', label: 'Industry', sort: (a, b) => (a.industry || '').localeCompare(b.industry || '') },
  { key: 'priority', label: 'Priority', sort: (a, b) => {
    const order = { hot: 0, normal: 1, low: 2 };
    return (order[a.priority] || 1) - (order[b.priority] || 1);
  }},
];

// Sale types for the scorecard business
export const SALE_TYPES = [
  { key: 'single', label: 'Single Banner', price: 395, saleCount: 1 },
  { key: 'double', label: 'Double Banner', price: 790, saleCount: 2 },
  { key: 'triple', label: 'Triple Banner', price: 1185, saleCount: 3 },
  { key: 'quad', label: 'Quad Banner', price: 1580, saleCount: 4 },
  { key: 'custom', label: 'Custom Amount', price: 0, saleCount: 1 },
];
