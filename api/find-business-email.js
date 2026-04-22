const MAX_PAGES = 5;
const CONTACT_PATH_HINTS = ['/contact', '/about', '/book', '/appointment', '/appointments', '/support', '/get-in-touch'];
const EMAIL_REGEX = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,})/g;

function normalizeUrl(rawUrl = '') {
  if (!rawUrl) return '';
  try {
    const withProtocol = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const url = new URL(withProtocol);
    url.hash = '';
    return url.toString();
  } catch {
    return '';
  }
}

function cleanEmail(email = '') {
  return String(email || '').trim().replace(/^mailto:/i, '').toLowerCase();
}

function isLikelyBusinessEmail(email = '', hostname = '') {
  const value = cleanEmail(email);
  if (!value) return false;
  if (value.includes('example.com') || value.includes('domain.com') || value.includes('email.com')) return false;
  if (value.endsWith('.png') || value.endsWith('.jpg') || value.endsWith('.jpeg') || value.endsWith('.webp')) return false;
  const domain = value.split('@')[1] || '';
  if (!domain) return false;
  if (hostname && domain.includes(hostname.replace(/^www\./, ''))) return true;
  if (['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'].includes(domain)) return true;
  return true;
}

function extractEmails(html = '', pageUrl = '', baseHostname = '') {
  const found = new Map();
  const lowerHtml = String(html || '');

  const mailtoMatches = lowerHtml.match(/mailto:[^"'?\s>]+/gi) || [];
  for (const match of mailtoMatches) {
    const email = cleanEmail(match.split('?')[0]);
    if (!isLikelyBusinessEmail(email, baseHostname)) continue;
    found.set(email, {
      email,
      source: 'mailto',
      confidence: 'high',
      pageUrl,
      notes: `Found via mailto link on ${new URL(pageUrl).pathname || '/'}`,
    });
  }

  const textMatches = lowerHtml.match(EMAIL_REGEX) || [];
  for (const match of textMatches) {
    const email = cleanEmail(match);
    if (!isLikelyBusinessEmail(email, baseHostname) || found.has(email)) continue;
    found.set(email, {
      email,
      source: pageUrl.includes('/contact') ? 'website_contact_page' : 'website_text',
      confidence: pageUrl.includes('/contact') ? 'high' : 'medium',
      pageUrl,
      notes: `Found in page text on ${new URL(pageUrl).pathname || '/'}`,
    });
  }

  return Array.from(found.values());
}

function extractCandidateLinks(html = '', rootUrl = '') {
  const root = new URL(rootUrl);
  const matches = html.match(/href=["'][^"']+["']/gi) || [];
  const urls = new Set();

  for (const raw of matches) {
    const href = raw.slice(6, -1).trim();
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    try {
      const nextUrl = new URL(href, root);
      if (nextUrl.hostname !== root.hostname) continue;
      const path = nextUrl.pathname.toLowerCase();
      if (CONTACT_PATH_HINTS.some(hint => path.includes(hint))) {
        nextUrl.hash = '';
        urls.add(nextUrl.toString());
      }
    } catch {
      continue;
    }
  }

  for (const hint of CONTACT_PATH_HINTS) {
    urls.add(new URL(hint, root).toString());
  }

  return Array.from(urls).slice(0, MAX_PAGES - 1);
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'HighVolumeCRM Email Discovery Bot/1.0',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.text();
}

async function fetchHtmlWithFallback(url) {
  try {
    return await fetchHtml(url);
  } catch (error) {
    try {
      const current = new URL(url);
      if (current.protocol === 'https:') {
        current.protocol = 'http:';
        return await fetchHtml(current.toString());
      }
    } catch {
      // ignore fallback parsing error
    }
    throw error;
  }
}

function chooseBestEmail(candidates = [], hostname = '') {
  const scored = [...candidates].sort((a, b) => {
    const score = (item) => {
      let value = item.confidence === 'high' ? 3 : item.confidence === 'medium' ? 2 : 1;
      const domain = (item.email.split('@')[1] || '').replace(/^www\./, '');
      if (hostname && domain === hostname.replace(/^www\./, '')) value += 2;
      if (item.source === 'mailto' || item.source === 'website_contact_page') value += 1;
      return value;
    };
    return score(b) - score(a);
  });

  return scored[0] || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { website, businessName = '' } = req.body || {};
  const normalizedWebsite = normalizeUrl(website);
  if (!normalizedWebsite) {
    return res.status(400).json({ error: 'A valid website URL is required.' });
  }

  try {
    const rootUrl = new URL(normalizedWebsite);
    const homepageHtml = await fetchHtmlWithFallback(rootUrl.toString());
    const pageUrls = [rootUrl.toString(), ...extractCandidateLinks(homepageHtml, rootUrl.toString())].slice(0, MAX_PAGES);

    const allCandidates = [];
    const visited = new Set();

    for (const pageUrl of pageUrls) {
      if (visited.has(pageUrl)) continue;
      visited.add(pageUrl);
      try {
        const html = pageUrl === rootUrl.toString() ? homepageHtml : await fetchHtmlWithFallback(pageUrl);
        allCandidates.push(...extractEmails(html, pageUrl, rootUrl.hostname));
      } catch {
        continue;
      }
    }

    const best = chooseBestEmail(allCandidates, rootUrl.hostname);
    if (!best) {
      return res.status(200).json({
        businessName,
        website: normalizedWebsite,
        status: 'not_found',
        email: '',
        confidence: 'low',
        source: 'website_scan',
        notes: 'No email address found on homepage or common contact pages.',
        checkedPages: Array.from(visited),
      });
    }

    return res.status(200).json({
      businessName,
      website: normalizedWebsite,
      status: 'found',
      email: best.email,
      confidence: best.confidence,
      source: best.source,
      notes: best.notes,
      checkedPages: Array.from(visited),
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Unable to scan website for email.',
    });
  }
}
