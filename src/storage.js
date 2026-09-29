// Settings and progress live on the device only.
const KEY = 'zoomi-moves-v1';

const DEFAULTS = {
  buddy: 'bear',
  camera: true,
  voice: true,
  quality: 'auto',
  musicVolume: 0.8,
  stickers: [],
  stars: {},
  totalStars: 0,
};

export function loadState() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage unavailable (private mode): progress just isn't kept
  }
}

// Imported songs are audio blobs, too big for localStorage, so they go in IndexedDB.
function db() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('zoomi-songs', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('songs', { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction('songs', mode);
    const result = fn(t.objectStore('songs'));
    t.oncomplete = () => resolve(result.result ?? result);
    t.onerror = () => reject(t.error);
  });
}

export const SongStore = {
  async list() {
    try {
      return (await tx('readonly', (s) => s.getAll())) || [];
    } catch {
      return [];
    }
  },
  async add(song) {
    try {
      await tx('readwrite', (s) => s.put(song));
      return true;
    } catch {
      return false;
    }
  },
  async remove(id) {
    try {
      await tx('readwrite', (s) => s.delete(id));
    } catch {
      // ignore
    }
  },
};
