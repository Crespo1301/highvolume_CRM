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
    const searchPayload = await requestJson('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': SEARCH_FIELDS,
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: Math.max(1, Math.min(Number(maxResults) || 10, 20)),
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

    return res.status(200).json({
      query,
      leads: detailResults.filter(place => place.businessName),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to search Google Places.' });
  }
}
