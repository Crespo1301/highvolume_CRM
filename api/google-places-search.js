const SEARCH_FIELDS = [
  'places.id',
  'places.name',
  'places.displayName',
  'places.formattedAddress',
  'places.primaryType',
  'places.types',
].join(',');

const DETAIL_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'websiteUri',
  'nationalPhoneNumber',
  'rating',
  'userRatingCount',
  'googleMapsUri',
  'primaryType',
  'types',
  'businessStatus',
].join(',');

const CHAIN_KEYWORDS = [
  'walmart', 'target', 'costco', 'home depot', 'lowes', 'starbucks', 'mcdonald', 'burger king',
  'taco bell', 'subway', 'dominos', 'pizza hut', 'kfc', 'chipotle', 'panera', 'dunkin',
  'whole foods', 'trader joe', 'walgreens', 'cvs', 'rite aid', 'bank of america', 'chase',
  'wells fargo', 'us bank', 'marriott', 'hilton', 'hyatt', 'ihop', 'applebees', 'olive garden'
];

function computeProspectFit(place = {}) {
  const name = String(place.businessName || '').toLowerCase();
  const reviewCount = Number(place.userRatingCount) || 0;
  const rating = typeof place.rating === 'number' ? place.rating : 0;
  const hasWebsite = Boolean(place.website);
  const hasPhone = Boolean(place.phone);
  const isOperational = !place.businessStatus || place.businessStatus === 'OPERATIONAL';
  const chainPenalty = CHAIN_KEYWORDS.some(keyword => name.includes(keyword));

  let score = 0;

  if (isOperational) score += 2;
  if (hasPhone) score += 1;
  if (hasWebsite) score += 2;

  if (reviewCount >= 10 && reviewCount <= 200) score += 7;
  else if (reviewCount >= 5 && reviewCount < 10) score += 3;
  else if (reviewCount > 200 && reviewCount <= 350) score += 2;
  else if (reviewCount > 350 && reviewCount <= 600) score -= 3;
  else if (reviewCount > 600) score -= 7;

  if (rating >= 3.6 && rating <= 4.8) score += 2;
  else if (rating > 4.9) score -= 1;
  else if (rating > 0 && rating < 3.4) score -= 1;

  if (!hasWebsite && reviewCount >= 15) score += 2;
  if (!hasWebsite && reviewCount < 5) score -= 2;
  if (chainPenalty) score -= 10;

  return score;
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      `Google Places request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

async function fetchPlaceDetails(resourceName, apiKey) {
  return requestJson(`https://places.googleapis.com/v1/${resourceName}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': DETAIL_FIELDS,
    },
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GOOGLE_PLACES_API_KEY environment variable.' });
  }

  const { query, maxResults = 10 } = req.body || {};
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'A text query is required.' });
  }

  try {
    const requestedCount = Math.max(1, Math.min(Number(maxResults) || 10, 20));
    const searchPayload = await requestJson('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': SEARCH_FIELDS,
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: Math.min(Math.max(requestedCount * 2, 12), 20),
        languageCode: 'en',
        regionCode: 'US',
      }),
    });

    const places = Array.isArray(searchPayload.places) ? searchPayload.places : [];
    const detailResults = await Promise.all(
      places.map(async (place) => {
        try {
          const details = await fetchPlaceDetails(place.name, apiKey);
          return {
            id: details.id || place.id || '',
            businessName: details.displayName?.text || place.displayName?.text || '',
            address: details.formattedAddress || place.formattedAddress || '',
            website: details.websiteUri || '',
            phone: details.nationalPhoneNumber || '',
            rating: details.rating ?? null,
            userRatingCount: details.userRatingCount ?? 0,
            googleMapsUri: details.googleMapsUri || '',
            businessStatus: details.businessStatus || '',
            primaryType: details.primaryType || place.primaryType || '',
            types: details.types || place.types || [],
          };
        } catch (error) {
          return {
            id: place.id || '',
            businessName: place.displayName?.text || '',
            address: place.formattedAddress || '',
            website: '',
            phone: '',
            rating: null,
            userRatingCount: 0,
            googleMapsUri: '',
            businessStatus: '',
            primaryType: place.primaryType || '',
            types: place.types || [],
            partial: true,
          };
        }
      })
    );

    const rankedPlaces = detailResults
      .filter(place => place.businessName)
      .map(place => ({
        ...place,
        prospectFitScore: computeProspectFit(place),
      }))
      .sort((a, b) => {
        if (b.prospectFitScore !== a.prospectFitScore) return b.prospectFitScore - a.prospectFitScore;
        return (a.userRatingCount || 0) - (b.userRatingCount || 0);
      })
      .slice(0, requestedCount);

    return res.status(200).json({
      query,
      leads: rankedPlaces,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to search Google Places.' });
  }
}
