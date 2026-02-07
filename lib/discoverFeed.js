// Backend seam for discover presence: fetch/subscribe can be swapped to chat-room presence later.
export const DISCOVER_PAGE_SIZE = 7;

const DISCOVER_QUERY_LIMIT = 40;
const SIMULATED_DISCOVER_MIN_INTERVAL_MS = 9000;
const SIMULATED_DISCOVER_JITTER_MS = 6000;

const SIMULATED_INCOMING_ENTRIES = [
  {
    id: 'demo-arrival-iris',
    display_name: 'Iris',
    pronouns: 'she/her',
    bio: 'Design student. Draws tiny city maps from memory.',
    is_bot: false,
    avatar_url: '/bots/bot-2.jpg',
    vibe: 'curious'
  },
  {
    id: 'demo-arrival-axel',
    display_name: 'Axel',
    pronouns: 'he/him',
    bio: 'Night cyclist. Keeps playlists for every weather.',
    is_bot: false,
    avatar_url: '/bots/bot-3.jpg',
    vibe: 'playful'
  },
  {
    id: 'demo-arrival-kite',
    display_name: 'Kite',
    pronouns: 'they/them',
    bio: 'Coffee tinkerer. Will ask one brave question.',
    is_bot: false,
    avatar_url: '/bots/bot-4.jpg',
    vibe: 'bold'
  },
  {
    id: 'demo-arrival-echo',
    display_name: 'Echo',
    pronouns: 'he/they',
    bio: 'Audio nerd bot. Collects sweet one-liners.',
    is_bot: true,
    avatar_url: '/bots/bot-1.jpg',
    vibe: 'sunset'
  },
  {
    id: 'demo-arrival-sage',
    display_name: 'Sage',
    pronouns: 'she/they',
    bio: 'Plant keeper bot. Slow chats, clear boundaries.',
    is_bot: true,
    avatar_url: '/bots/bot-5.jpg',
    vibe: 'slow-burn'
  }
];

const toTimestamp = (value) => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const resolveDiscoverTimestamp = (entry, fallbackMs = 0) => {
  return (
    toTimestamp(entry?.discover_joined_at) ||
    toTimestamp(entry?.created_at) ||
    toTimestamp(entry?.updated_at) ||
    fallbackMs
  );
};

export const normalizeDiscoverEntries = (entries = []) => {
  const now = Date.now();
  return entries.map((entry, index) => {
    const joinedAt = new Date(resolveDiscoverTimestamp(entry, now - index * 1000)).toISOString();
    return {
      ...entry,
      discover_joined_at: joinedAt
    };
  });
};

export const sortDiscoverEntriesNewestFirst = (entries = []) => {
  return [...entries].sort((a, b) => resolveDiscoverTimestamp(b) - resolveDiscoverTimestamp(a));
};

export const seedDiscoverEntries = (entries = []) => {
  return sortDiscoverEntriesNewestFirst(normalizeDiscoverEntries(entries));
};

export const mergeDiscoverEntry = (entries = [], incoming) => {
  if (!incoming?.id) return entries;
  const nextIncoming = normalizeDiscoverEntries([incoming])[0];
  const remaining = entries.filter((entry) => entry.id !== nextIncoming.id);
  return sortDiscoverEntriesNewestFirst([nextIncoming, ...remaining]);
};

const filterDiscoverEntries = (entries, { viewerId, blockSet = new Set() }) => {
  return entries.filter((entry) => entry.id !== viewerId && !blockSet.has(entry.id));
};

export const fetchDiscoverEntries = async ({
  supabase,
  viewerId,
  blockSet = new Set(),
  limit = DISCOVER_QUERY_LIMIT
}) => {
  if (!supabase || !viewerId) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', viewerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];

  const normalized = seedDiscoverEntries(data || []);
  return filterDiscoverEntries(normalized, { viewerId, blockSet });
};

export const subscribeToDiscoverEntries = ({ supabase, viewerId, onEntry }) => {
  if (!supabase || !viewerId || typeof onEntry !== 'function') {
    return () => {};
  }

  const channel = supabase
    .channel(`discover-${viewerId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, (payload) => {
      const entry = payload?.new;
      if (!entry || entry.id === viewerId) return;
      onEntry(normalizeDiscoverEntries([entry])[0]);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const createSimulatedDiscoverStream = ({ onEntry, intervalMs } = {}) => {
  if (typeof onEntry !== 'function' || !SIMULATED_INCOMING_ENTRIES.length) {
    return () => {};
  }

  const baseInterval = Math.max(intervalMs || SIMULATED_DISCOVER_MIN_INTERVAL_MS, 1000);
  let timer = null;
  let cursor = 0;

  const emitNext = () => {
    const template = SIMULATED_INCOMING_ENTRIES[cursor % SIMULATED_INCOMING_ENTRIES.length];
    cursor += 1;
    onEntry({
      ...template,
      discover_joined_at: new Date().toISOString()
    });

    const jitter = Math.floor(Math.random() * SIMULATED_DISCOVER_JITTER_MS);
    timer = setTimeout(emitNext, baseInterval + jitter);
  };

  timer = setTimeout(emitNext, baseInterval);

  return () => {
    if (timer) {
      clearTimeout(timer);
    }
  };
};
