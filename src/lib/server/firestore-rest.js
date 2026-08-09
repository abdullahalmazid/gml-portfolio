/**
 * Firestore REST (server only)
 * src/lib/server/firestore-rest.js
 *
 * Reads Firestore from server components — for page metadata and the sitemap.
 *
 * The client SDK can't be used here: it needs a browser, and it would ship
 * another copy of Firebase into the server bundle. The REST API needs no SDK
 * and no service account, because your security rules already allow public
 * reads of this content — the same data any visitor's browser fetches.
 *
 * Responses are cached by Next for `revalidate` seconds, so metadata for a
 * page is not re-fetched on every request.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/** Firestore REST wraps every value in a type tag. Unwrap recursively. */
function decodeValue(value) {
  if (!value || typeof value !== 'object') return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
  if ('referenceValue' in value) return value.referenceValue;
  return null;
}

function decodeFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) out[k] = decodeValue(v);
  return out;
}

function decodeDoc(doc) {
  if (!doc?.name) return null;
  return {
    id: doc.name.split('/').pop(),
    ...decodeFields(doc.fields || {}),
    _updated: doc.updateTime || null,
  };
}

/** One document, or null when missing or unreachable. */
export async function getDocREST(collection, id, { revalidate = 300 } = {}) {
  if (!PROJECT_ID || !API_KEY || !collection || !id) return null;

  try {
    const res = await fetch(`${BASE}/${collection}/${id}?key=${API_KEY}`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    return decodeDoc(await res.json());
  } catch {
    // Metadata must never break a page render.
    return null;
  }
}

/** A whole collection. Hidden documents are dropped, as on the public site. */
export async function getCollectionREST(collection, { revalidate = 300, includeHidden = false } = {}) {
  if (!PROJECT_ID || !API_KEY || !collection) return [];

  try {
    const res = await fetch(`${BASE}/${collection}?key=${API_KEY}&pageSize=300`, {
      next: { revalidate },
    });
    if (!res.ok) return [];

    const json = await res.json();
    const docs = (json.documents || []).map(decodeDoc).filter(Boolean);
    return includeHidden ? docs : docs.filter((d) => d.hidden !== true);
  } catch {
    return [];
  }
}
