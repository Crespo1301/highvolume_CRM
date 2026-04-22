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
  filters: 'crm_filters',
  session: 'crm_session',
  importJobs: 'crm_import_jobs',
  audits: 'crm_audits'
};

export const MARKET_PRESETS = [
  { key: 'renton', label: 'Renton, WA', queryLabel: 'Renton WA', city: 'Renton', region: 'WA', marketMatch: 'Seattle' },
  { key: 'seattle', label: 'Seattle, WA', queryLabel: 'Seattle WA', city: 'Seattle', region: 'WA', marketMatch: 'Seattle' },
  { key: 'boston', label: 'Boston, MA', queryLabel: 'Boston MA', city: 'Boston', region: 'MA', marketMatch: 'Boston' },
  { key: 'san-francisco', label: 'San Francisco, CA', queryLabel: 'San Francisco CA', city: 'San Francisco', region: 'CA', marketMatch: 'San Francisco' },
];

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

// Follow-up / callback display: show time only when it's meaningful (not default noon/midnight).
export const formatFollowUpDisplay = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  const isDefaultNoon = d.getHours() === 12 && d.getMinutes() === 0 && /T12:00:00/.test(String(dateStr));
  const isMidnight = d.getHours() === 0 && d.getMinutes() === 0;
  const datePart = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  if (isDefaultNoon || isMidnight) return datePart;
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${datePart} • ${timePart}`;
};

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
export const parseDateInput = (dateStr, timeStr = '') => {
  if (!dateStr) return '';
  const cleanTime = (timeStr || '').trim();
  if (!cleanTime) return `${dateStr}T12:00:00`;
  return `${dateStr}T${cleanTime.length === 5 ? cleanTime + ':00' : cleanTime}`;
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
  dailyGoal: 150, // calls/day target
  dailySalesGoal: 2, // deals/day target
  // Revenue goals (rep-adjustable)
  dailyRevenueGoal: 0,
  weeklyRevenueGoal: 0,
  // Quotas (monthly)
  quotaMonth: '2026-03',
  monthlyQuota: 0,
  activeGolfCourse: null 
};


export const isDueToday = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
};

/**
 * Follow-up status helper
 * - 'overdue'  : date is before today
 * - 'due'      : date is today
 * - 'upcoming' : date is in the future
 */
export const followUpStatus = (dateStr) => {
  if (!dateStr) return 'upcoming';
  if (isOverdue(dateStr)) return 'overdue';
  if (isDueToday(dateStr)) return 'due';
  return 'upcoming';
};

export const WEBSITE_STATUS_OPTIONS = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'none', label: 'No Website' },
  { value: 'facebookOnly', label: 'Facebook Only' },
  { value: 'outdated', label: 'Outdated Website' },
  { value: 'good', label: 'Good Website' }
];

export const normalizeWebsiteStatus = (value = '') => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'unknown';
  if (['none', 'no website', 'missing', 'n/a'].includes(normalized)) return 'none';
  if (['facebookonly', 'facebook only', 'facebook-only', 'fb only'].includes(normalized)) return 'facebookOnly';
  if (['outdated', 'old', 'needs update', 'needs improvement'].includes(normalized)) return 'outdated';
  if (['good', 'modern', 'strong', 'live'].includes(normalized)) return 'good';
  return 'unknown';
};

export const scoreLead = (lead = {}) => {
  let score = 0;
  const status = lead.websiteStatus || '';
  if (status === 'none') score += 5;
  else if (status === 'facebookOnly') score += 4;
  else if (status === 'outdated') score += 3;
  if (lead.city) score += 2;
  if (!lead.websiteUrl && !lead.website) score += 2;
  return score;
};

export const classifyPriorityFromScore = (score = 0) => {
  if (score >= 7) return 'hot';
  if (score >= 4) return 'normal';
  return 'low';
};

export const generateWebsiteAudit = (lead = {}) => {
  const status = lead.websiteStatus || (lead.websiteUrl || lead.website ? 'outdated' : 'none');
  const templates = {
    none: { mobileFriendly: 'Missing', loadSpeed: 'Missing', contactForm: 'Missing', googleMap: 'Missing', servicesPage: 'Missing', modernDesign: 'Missing', callToAction: 'Missing' },
    facebookOnly: { mobileFriendly: 'Needs Improvement', loadSpeed: 'Needs Improvement', contactForm: 'Missing', googleMap: 'Missing', servicesPage: 'Missing', modernDesign: 'Needs Improvement', callToAction: 'Missing' },
    outdated: { mobileFriendly: 'Needs Improvement', loadSpeed: 'Needs Improvement', contactForm: 'Needs Improvement', googleMap: 'Needs Improvement', servicesPage: 'Needs Improvement', modernDesign: 'Needs Improvement', callToAction: 'Needs Improvement' },
    good: { mobileFriendly: 'Good', loadSpeed: 'Good', contactForm: 'Good', googleMap: 'Good', servicesPage: 'Good', modernDesign: 'Good', callToAction: 'Good' }
  };
  return templates[status] || templates.outdated;
};

export const generateAuditSummary = (lead = {}) => {
  const status = normalizeWebsiteStatus(lead.websiteStatus);
  const name = lead.businessName || 'This business';

  if (status === 'none') {
    return `${name} has no clear standalone website presence, so the biggest opportunity is building a trustworthy home base with clear calls, contact, and service information.`;
  }
  if (status === 'facebookOnly') {
    return `${name} appears to rely heavily on Facebook instead of a full website, which limits search visibility, conversion flow, and long-term brand control.`;
  }
  if (status === 'outdated') {
    return `${name} has a website, but the likely opportunity is modernization: stronger design, clearer messaging, better lead capture, and a more current mobile experience.`;
  }
  if (status === 'good') {
    return `${name} already has a functional website, so the best angle is improving conversion rate, speed, SEO structure, and follow-up pathways.`;
  }
  return `${name} should be reviewed for missed conversion opportunities across trust, speed, mobile experience, and contact flow.`;
};

export const generateAuditTalkingPoints = (lead = {}) => {
  const audit = generateWebsiteAudit(lead);
  const points = [];

  if (audit.mobileFriendly !== 'Good') points.push('Mobile experience likely needs attention');
  if (audit.loadSpeed !== 'Good') points.push('Page speed may be costing conversions');
  if (audit.contactForm !== 'Good') points.push('Contact flow can be made easier for new leads');
  if (audit.googleMap !== 'Good') points.push('Local trust signals like map and location details can be stronger');
  if (audit.servicesPage !== 'Good') points.push('Services and offers may not be explained clearly enough');
  if (audit.modernDesign !== 'Good') points.push('Design can feel more current and trust-building');
  if (audit.callToAction !== 'Good') points.push('Calls to action can be more direct and conversion-focused');

  return points.length ? points : ['Site is in decent shape, so focus on conversion gains and stronger lead capture'];
};

export const generateEmailDraft = (lead = {}) => {
  const businessName = lead.businessName || 'your business';
  const city = lead.city ? ` in ${lead.city}` : '';
  const angle = generateOutreachAngle(lead);
  const subject = `Quick website idea for ${businessName}`;
  const body = [
    `Hi,`,
    ``,
    `I came across ${businessName}${city} and noticed a few opportunities on the web presence side.`,
    angle,
    `I help businesses tighten up their site, improve trust, and turn more visitors into calls or inquiries.`,
    `If helpful, I can put together a quick no-pressure audit with a few specific suggestions.`,
    ``,
    `Best,`,
  ].join('\n');

  return { subject, body };
};

export const generateOutreachAngle = (lead = {}) => {
  const name = lead.businessName || 'This business';
  const city = lead.city ? ` in ${lead.city}` : '';
  const status = normalizeWebsiteStatus(lead.websiteStatus);

  if (status === 'none') {
    return `${name}${city} does not appear to have a dedicated website, which makes it harder for new leads to find contact info and trust the business quickly.`;
  }
  if (status === 'facebookOnly') {
    return `${name}${city} appears to rely mostly on Facebook, which can work for existing customers but usually leaves search traffic and direct conversions on the table.`;
  }
  if (status === 'outdated') {
    return `${name}${city} has a web presence, but it likely needs a cleaner modern update, clearer calls to action, and a stronger trust-building experience.`;
  }
  if (status === 'good') {
    return `${name}${city} already has a decent website, so the outreach angle should focus on conversion improvements, speed, SEO, and lead capture refinements.`;
  }
  return `${name}${city} should be reviewed for website quality and conversion opportunities before outreach.`;
};

// Industry categories
export const INDUSTRIES = [
  'Contractor / Home Services',
  'Landscaping',
  'Plumbing',
  'Electrical',
  'Cleaning Company',
  'Construction',
  'Accounting / Bookkeeping',
  'Restaurant',
  'Medical / Healthcare',
  'Dental Office',
  'Legal Services',
  'Real Estate',
  'Insurance',
  'Fitness / Gym',
  'Salon / Spa',
  'Retail Store',
  'Professional Services',
  'Auto Services',
  'Marketing / Agency',
  'Other'
];

// Lead sources
export const SOURCES = [
  'Google Maps',
  'Google Places API',
  'Facebook',
  'Instagram',
  'Walk-In',
  'Referral',
  'Cold Call',
  'Website',
  'Social Media',
  'Yelp',
  'Other'
];

export const OUTREACH_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'audit_ready', label: 'Audit Ready' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'replied', label: 'Replied' },
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

export const normalizeGooglePlaceLead = (place = {}, options = {}) => {
  const market = MARKET_PRESETS.find(m => m.key === options.marketKey);
  const website = place.website || place.websiteUri || '';
  const websiteStatus = website ? 'outdated' : 'none';
  const city = options.city || market?.city || '';
  const region = options.region || market?.region || '';
  const score = scoreLead({
    websiteStatus,
    websiteUrl: website,
    city,
  });

  return {
    id: generateId(),
    businessName: place.businessName || place.displayName || '',
    contactName: '',
    phone: place.phone || place.nationalPhoneNumber || '',
    email: '',
    address: place.address || place.formattedAddress || '',
    website,
    websiteStatus,
    industry: options.industry || 'Other',
    city,
    region,
    notes: '',
    priority: classifyPriorityFromScore(score),
    priorityScore: score,
    source: 'Google Places API',
    followUp: '',
    callCount: 0,
    callHistory: [],
    googlePlaceId: place.googlePlaceId || place.id || '',
    googleMapsUri: place.googleMapsUri || '',
    googleRating: typeof place.rating === 'number' ? place.rating : null,
    googleReviewCount: typeof place.userRatingCount === 'number' ? place.userRatingCount : 0,
    googleBusinessStatus: place.businessStatus || '',
    primaryType: place.primaryType || '',
    importedFromMarket: market?.label || options.marketLabel || '',
    importedQuery: options.query || '',
    golfCourseId: options.golfCourseId || '',
  };
};

export const normalizeFacebookLead = (lead = {}, options = {}) => {
  const market = MARKET_PRESETS.find(m => m.key === options.marketKey);
  const website = lead.website || '';
  const facebookUrl = lead.facebookUrl || lead.facebook || lead.pageUrl || '';
  const websiteStatus = normalizeWebsiteStatus(
    lead.websiteStatus || (website ? 'outdated' : (facebookUrl ? 'facebookOnly' : 'unknown'))
  );
  const city = lead.city || options.city || market?.city || '';
  const region = lead.region || options.region || market?.region || '';
  const score = scoreLead({
    websiteStatus,
    websiteUrl: website,
    city,
  });

  return {
    id: generateId(),
    businessName: lead.businessName || lead.name || '',
    contactName: lead.contactName || '',
    phone: lead.phone || '',
    email: lead.email || '',
    address: lead.address || '',
    website,
    websiteStatus,
    industry: lead.industry || options.industry || 'Other',
    city,
    region,
    notes: lead.notes || '',
    priority: classifyPriorityFromScore(score),
    priorityScore: score,
    source: lead.source || 'Facebook',
    followUp: lead.followUp || '',
    callCount: 0,
    callHistory: [],
    facebookUrl,
    facebookPageName: lead.facebookPageName || lead.name || '',
    importedFromMarket: market?.label || options.marketLabel || '',
    importedQuery: options.query || '',
    outreachAngle: generateOutreachAngle({ ...lead, businessName: lead.businessName || lead.name || '', websiteStatus, city }),
    golfCourseId: options.golfCourseId || lead.golfCourseId || '',
  };
};

// --- Quota helpers ---
export const daysInMonth = (ym) => {
  // ym: 'YYYY-MM'
  if (!ym || ym.length < 7) return 30;
  const [y, m] = ym.split('-').map(n => parseInt(n, 10));
  // month is 1-12
  return new Date(y, m, 0).getDate();
};

export const weeksInMonth = (ym) => {
  // Simple calendar week count for the month
  if (!ym || ym.length < 7) return 4;
  const [y, m] = ym.split('-').map(n => parseInt(n, 10));
  const first = new Date(y, m - 1, 1);
  const dim = new Date(y, m, 0).getDate();
  const offset = first.getDay(); // 0=Sun
  return Math.ceil((dim + offset) / 7);
};
