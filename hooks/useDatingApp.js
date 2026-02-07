import { useEffect, useMemo, useRef, useState } from 'react';
import { demoProfiles, demoQuickReplies, demoUser } from '../lib/demoData';
import { flowStages } from '../lib/flowData';
import { sparkLines } from '../lib/sparkData';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import {
  createSimulatedDiscoverStream,
  fetchDiscoverEntries,
  mergeDiscoverEntry,
  seedDiscoverEntries,
  subscribeToDiscoverEntries
} from '../lib/discoverFeed';
import {
  DATE_DURATION_MS,
  SPARK_RESULT_LIMIT,
  buildRoomName,
  getMatchLabel,
  isDateActive,
  rankRespondersWithFilter
} from '../lib/chatUtils';

const AGE_STORAGE_KEY = 'dabon-age-verified';
const GEMINI_KEY_STORAGE_KEY = 'dabon-gemini-api-key';
const OPENAI_KEY_STORAGE_KEY = 'dabon-openai-api-key';
const AVATAR_PROVIDER_STORAGE_KEY = 'dabon-avatar-provider';

const REPORT_REASONS = [
  { value: 'harassment', label: 'Harassment or abuse' },
  { value: 'spam', label: 'Spam or scam' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'underage', label: 'Suspected underage' },
  { value: 'other', label: 'Other' }
];

const BOT_FOLLOWUP_DELAY_MS = 45 * 1000;

const BOT_AUTONOMY_PROMPTS = {
  opener: [
    'Start the chat with a short, playful opener. Ask one curious question.',
    'Send a warm, consent-forward opener in under 12 words.',
    'Open with a flirty but respectful question that invites a reply.'
  ],
  followUp: [
    'Send a gentle follow-up if they have not replied yet. Keep it low-pressure.',
    'Offer a soft check-in and one easy question.',
    'Nudge the conversation with a playful, non-demanding line.'
  ]
};

const BOT_AUTONOMY_DEMO_LINES = {
  opener: [
    'Hey you. What kind of first chat makes you smile?',
    'Soft question: what is your favorite tiny ritual?',
    'I am curious. What is your vibe tonight?'
  ],
  followUp: [
    'No rush. Want a playful question or a calm one?',
    'Still here. Should I ask something bold or gentle?',
    'Whenever you are ready, I am listening.'
  ]
};

const DEFAULT_DISCOVER_RATING = { human: 0, bot: 100 };
const DISCOVER_RATING_STEP = 10;

const DEFAULT_AVATAR_INTERVIEW = {
  archetype: 'friendly',
  composition: 'headshot',
  palette: 'cyan-red',
  expression: 'playful',
  motif: 'heart-core',
  background: 'flat'
};

const AVATAR_INTERVIEW_TEXT = {
  archetype: {
    friendly: 'cute friendly robot mascot',
    sleek: 'sleek futuristic robot',
    retro: 'retro arcade style robot',
    abstract: 'abstract robot symbol'
  },
  composition: {
    headshot: 'centered robot head icon',
    bust: 'robot bust portrait with shoulders',
    full: 'simple full-body robot character',
    emblem: 'badge-like abstract robot emblem'
  },
  palette: {
    'cyan-red': 'cyan, red, white, and black high-contrast palette',
    'yellow-blue': 'yellow, blue, white, and black playful palette',
    'pink-pop': 'pink, sky-blue, white, and black pop palette',
    mono: 'limited monochrome palette with one accent color'
  },
  expression: {
    playful: 'playful and approachable face',
    calm: 'calm and soft face',
    bold: 'confident bold expression',
    curious: 'curious bright-eyed expression'
  },
  motif: {
    'heart-core': 'heart symbol integrated in chest or face panel',
    signals: 'small signal lines, dots, and panel details',
    split: 'split or mirrored duality motif',
    minimal: 'minimal simple face with tiny geometric details'
  },
  background: {
    flat: 'solid flat background color',
    gradient: 'soft radial gradient background',
    ring: 'circular badge ring around subject',
    textured: 'subtle grain texture over flat background'
  }
};

const buildAvatarPrompt = ({ displayName, pronouns, bio, interview = DEFAULT_AVATAR_INTERVIEW }) => {
  const resolved = {
    archetype: AVATAR_INTERVIEW_TEXT.archetype[interview.archetype] || AVATAR_INTERVIEW_TEXT.archetype.friendly,
    composition: AVATAR_INTERVIEW_TEXT.composition[interview.composition] || AVATAR_INTERVIEW_TEXT.composition.headshot,
    palette: AVATAR_INTERVIEW_TEXT.palette[interview.palette] || AVATAR_INTERVIEW_TEXT.palette['cyan-red'],
    expression: AVATAR_INTERVIEW_TEXT.expression[interview.expression] || AVATAR_INTERVIEW_TEXT.expression.playful,
    motif: AVATAR_INTERVIEW_TEXT.motif[interview.motif] || AVATAR_INTERVIEW_TEXT.motif['heart-core'],
    background: AVATAR_INTERVIEW_TEXT.background[interview.background] || AVATAR_INTERVIEW_TEXT.background.flat
  };

  const segments = [
    'Create a 1:1 app icon illustration for "Date a Bot or Not".',
    'Style: modern vector icon, thick black outlines, rounded shapes, flat fills, high contrast.',
    'Keep it clean, centered, and readable at small sizes.',
    `Character type: ${resolved.archetype}.`,
    `Composition: ${resolved.composition}.`,
    `Palette: ${resolved.palette}.`,
    `Expression: ${resolved.expression}.`,
    `Motif: ${resolved.motif}.`,
    `Background: ${resolved.background}.`
  ];

  if (displayName) {
    segments.push(`Character vibe cue from name: ${displayName}.`);
  }

  if (pronouns) {
    segments.push(`Pronoun vibe cue: ${pronouns}.`);
  }

  if (bio) {
    segments.push(`Style hints from bio: ${bio}.`);
  }

  segments.push('No text, letters, logos, or watermarks anywhere in the image.');
  return segments.join(' ');
};

export function useDatingApp() {
  const [mode, setMode] = useState(isSupabaseConfigured ? 'checking' : 'demo');
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [discover, setDiscover] = useState(() => seedDiscoverEntries(demoProfiles));
  const [discoverRatings, setDiscoverRatings] = useState({});
  const [trackedDiscoverIds, setTrackedDiscoverIds] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [dateStatus, setDateStatus] = useState({});
  const [blocks, setBlocks] = useState([]);
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0].value);
  const [reportNotes, setReportNotes] = useState('');
  const [ageGateOpen, setAgeGateOpen] = useState(true);
  const [ageGateChecked, setAgeGateChecked] = useState(false);
  const [ageGateError, setAgeGateError] = useState('');
  const [profileDraft, setProfileDraft] = useState({
    display_name: '',
    pronouns: 'they/them',
    bio: '',
    avatar_url: '/bots/bot-6.jpg',
    is_bot: false,
    age_verified: false
  });
  const [avatarSourceProfile, setAvatarSourceProfile] = useState(null);
  const [avatarProvider, setAvatarProvider] = useState('gemini');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [avatarInterview, setAvatarInterview] = useState(DEFAULT_AVATAR_INTERVIEW);
  const [avatarError, setAvatarError] = useState('');
  const [avatarStatus, setAvatarStatus] = useState('');
  const [isAvatarBusy, setIsAvatarBusy] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [demoMessages, setDemoMessages] = useState({});
  const [sparkIndex, setSparkIndex] = useState(0);
  const [sparkInput, setSparkInput] = useState('');
  const [sparkResults, setSparkResults] = useState([]);
  const [sparkError, setSparkError] = useState('');
  const [responderFilter, setResponderFilter] = useState('mixed');
  const [flowStageByMatch, setFlowStageByMatch] = useState({});
  const [botAutoState, setBotAutoState] = useState({});

  const messagesRef = useRef([]);
  const selectedMatchRef = useRef(null);
  const selectedPartnerRef = useRef(null);
  const botAutoRef = useRef({});

  const blockedIds = useMemo(() => new Set(blocks.map((block) => block.blocked_id)), [blocks]);

  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selectedMatchId),
    [matches, selectedMatchId]
  );

  const selectedPartner = selectedMatch?.other;
  const selectedStatus = selectedMatchId ? dateStatus[selectedMatchId] : null;
  const currentSpark = sparkLines[sparkIndex % sparkLines.length];
  const currentFlowStageIndex = selectedMatchId ? flowStageByMatch[selectedMatchId] ?? 0 : 0;
  const currentFlowStage = flowStages[Math.min(currentFlowStageIndex, flowStages.length - 1)];
  const selfAvatarSource = useMemo(
    () => ({
      id: profile?.id || null,
      display_name: profileDraft.display_name || profile?.display_name || '',
      pronouns: profileDraft.pronouns || profile?.pronouns || 'they/them',
      bio: profileDraft.bio || profile?.bio || ''
    }),
    [
      profile?.id,
      profile?.display_name,
      profile?.pronouns,
      profile?.bio,
      profileDraft.display_name,
      profileDraft.pronouns,
      profileDraft.bio
    ]
  );
  const activeAvatarSource = avatarSourceProfile || selfAvatarSource;
  const avatarSourceName = activeAvatarSource.display_name || 'Current profile';
  const isUsingExternalAvatarSource =
    Boolean(avatarSourceProfile) && Boolean(avatarSourceProfile?.id) && avatarSourceProfile.id !== profile?.id;

  const responderPool = useMemo(() => {
    const pool = [...discover];
    matches.forEach((match) => {
      if (match.other && !pool.some((item) => item.id === match.other.id)) {
        pool.push(match.other);
      }
    });
    return pool.filter((item) => item.id !== profile?.id && !blockedIds.has(item.id));
  }, [discover, matches, profile?.id, blockedIds]);

  const sparkAuthor = useMemo(() => {
    const byName = responderPool.find((item) => item.display_name === currentSpark.from);
    if (byName) return byName;
    return demoProfiles.find((item) => item.display_name === currentSpark.from);
  }, [responderPool, currentSpark.from]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    selectedMatchRef.current = selectedMatch;
    selectedPartnerRef.current = selectedPartner;
  }, [selectedMatch, selectedPartner]);

  useEffect(() => {
    botAutoRef.current = botAutoState;
  }, [botAutoState]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setMode('demo');
      return;
    }

    let subscription;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session ?? null);
      setMode(data?.session ? 'app' : 'auth');
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setMode(nextSession ? 'app' : 'auth');
    });

    subscription = data?.subscription;
    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(AGE_STORAGE_KEY);
    if (stored === 'true') {
      setAgeGateOpen(false);
      setProfileDraft((prev) => ({ ...prev, age_verified: true }));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedKey = window.localStorage.getItem(GEMINI_KEY_STORAGE_KEY);
    if (storedKey) {
      setGeminiApiKey(storedKey);
    }
    const storedOpenAiKey = window.localStorage.getItem(OPENAI_KEY_STORAGE_KEY);
    if (storedOpenAiKey) {
      setOpenaiApiKey(storedOpenAiKey);
    }
    const storedProvider = window.localStorage.getItem(AVATAR_PROVIDER_STORAGE_KEY);
    if (storedProvider === 'openai' || storedProvider === 'gemini') {
      setAvatarProvider(storedProvider);
    }
  }, []);

  useEffect(() => {
    setAvatarPrompt((prev) => {
      if (prev.trim()) return prev;
      return buildAvatarPrompt({
        displayName: activeAvatarSource.display_name,
        pronouns: activeAvatarSource.pronouns,
        bio: activeAvatarSource.bio,
        interview: avatarInterview
      });
    });
  }, [
    activeAvatarSource.display_name,
    activeAvatarSource.pronouns,
    activeAvatarSource.bio,
    avatarInterview
  ]);

  useEffect(() => {
    if (mode === 'demo') {
      setProfile(demoUser);
      setDiscover(seedDiscoverEntries(demoProfiles));
      setDiscoverRatings({});
      setTrackedDiscoverIds([]);
      setNeedsProfile(false);
      setBlocks([]);
      return;
    }

    if (!session || !supabase) return;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        setAuthError(error.message);
        return;
      }

      if (!data) {
        setNeedsProfile(true);
        setProfile(null);
        return;
      }

      setProfile(data);
      setNeedsProfile(false);
    };

    loadProfile();
  }, [mode, session]);

  useEffect(() => {
    const discoverIdSet = new Set(discover.map((item) => item.id));

    setTrackedDiscoverIds((prev) => prev.filter((id) => discoverIdSet.has(id)));
    setDiscoverRatings((prev) => {
      const next = {};
      Object.keys(prev).forEach((id) => {
        if (discoverIdSet.has(id)) {
          next[id] = prev[id];
        }
      });
      return next;
    });
  }, [discover]);

  useEffect(() => {
    if (!profile) return;
    if (profile.age_verified) {
      setAgeGateOpen(false);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(AGE_STORAGE_KEY, 'true');
      }
    }
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    if (mode === 'demo') return;

    const loadData = async () => {
      const blockRows = await loadBlocks();
      const blockSet = new Set(blockRows.map((block) => block.blocked_id));
      await Promise.all([loadDiscover(blockSet), loadMatches(blockSet)]);
    };

    loadData();
  }, [profile, mode]);

  useEffect(() => {
    if (!selectedMatchId || mode === 'demo') return;
    if (!supabase) return;
    loadMessages(selectedMatchId);
  }, [selectedMatchId, mode]);

  const loadBlocks = async () => {
    if (!supabase || !profile) return [];
    const { data } = await supabase.from('blocks').select('*').eq('blocker_id', profile.id);
    const nextBlocks = data || [];
    setBlocks(nextBlocks);
    return nextBlocks;
  };

  const loadDiscover = async (blockSet = blockedIds) => {
    if (!supabase || !profile) return;
    const nextDiscover = await fetchDiscoverEntries({
      supabase,
      viewerId: profile.id,
      blockSet
    });
    setDiscover(nextDiscover);
  };

  const loadMatches = async (blockSet = blockedIds) => {
    if (!supabase || !profile) return;

    const { data: matchRows } = await supabase
      .from('matches')
      .select('*')
      .or(`user_a.eq.${profile.id},user_b.eq.${profile.id}`)
      .order('created_at', { ascending: false });

    const matchList = matchRows || [];
    const otherIds = matchList.map((match) => getMatchLabel(match, profile.id));

    let otherProfiles = [];
    if (otherIds.length) {
      const { data } = await supabase.from('profiles').select('*').in('id', otherIds);
      otherProfiles = data || [];
    }

    const composed = matchList.map((match) => {
      const otherId = getMatchLabel(match, profile.id);
      const other = otherProfiles.find((item) => item.id === otherId);
      return { ...match, other };
    });

    const filteredMatches = composed.filter((match) => !blockSet.has(match.other?.id));
    setMatches(filteredMatches);

    const hasSelected = filteredMatches.some((match) => match.id === selectedMatchId);
    if (!hasSelected) {
      setSelectedMatchId(filteredMatches.length ? filteredMatches[0].id : null);
      if (!filteredMatches.length) {
        setMessages([]);
      }
    } else if (filteredMatches.length && !selectedMatchId) {
      setSelectedMatchId(filteredMatches[0].id);
    }

    if (matchList.length) {
      const ids = matchList.map((match) => match.id);
      await loadDateStatus(ids);
      await loadFlowState(ids);
    }
  };

  const refreshMatches = async () => {
    const blockRows = await loadBlocks();
    const blockSet = new Set(blockRows.map((block) => block.blocked_id));
    await loadDiscover(blockSet);
    await loadMatches(blockSet);
  };

  const loadDateStatus = async (matchIds) => {
    if (!supabase || !profile) return;

    const { data } = await supabase
      .from('date_intents')
      .select('*')
      .in('match_id', matchIds);

    const nextStatus = {};
    matchIds.forEach((id) => {
      nextStatus[id] = { selfReady: false, otherReady: false };
    });

    (data || []).forEach((intent) => {
      if (!nextStatus[intent.match_id]) {
        nextStatus[intent.match_id] = { selfReady: false, otherReady: false };
      }

      if (intent.user_id === profile.id) {
        nextStatus[intent.match_id].selfReady = intent.ready;
      } else {
        nextStatus[intent.match_id].otherReady = intent.ready;
      }
    });

    setDateStatus(nextStatus);
  };

  const loadFlowState = async (matchIds) => {
    if (!supabase || !profile) return;

    const { data } = await supabase
      .from('match_flow_state')
      .select('*')
      .in('match_id', matchIds);

    setFlowStageByMatch((prev) => {
      const nextStages = { ...prev };
      matchIds.forEach((id) => {
        if (nextStages[id] === undefined) nextStages[id] = 0;
      });

      (data || []).forEach((row) => {
        nextStages[row.match_id] = row.stage ?? 0;
      });

      return nextStages;
    });
  };

  const loadMessages = async (matchId) => {
    if (!supabase) return;

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    setMessages(data || []);
  };

  const getAutoPrompt = (type) => {
    const options = BOT_AUTONOMY_PROMPTS[type] || [];
    if (!options.length) return '';
    return options[Math.floor(Math.random() * options.length)];
  };

  const sendBotAutonomousMessage = async (matchId, bot, type) => {
    if (!matchId || !bot?.is_bot) return;

    const prompt = getAutoPrompt(type);
    if (!prompt) return;

    if (mode === 'demo') {
      const demoOptions = BOT_AUTONOMY_DEMO_LINES[type] || BOT_AUTONOMY_DEMO_LINES.opener;
      const demoLine = demoOptions[Math.floor(Math.random() * demoOptions.length)];
      appendDemoMessage(matchId, {
        id: `demo-${Date.now()}-bot`,
        body: demoLine,
        created_at: new Date().toISOString(),
        sender_id: bot.id,
        is_bot: true
      });
      return;
    }

    const history = messagesRef.current
      .slice(-6)
      .map((msg) => `${msg.is_bot ? bot.display_name : 'Human'}: ${msg.body}`)
      .join('\n');

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInput: prompt,
        history,
        botName: bot.display_name,
        matchId,
        botId: bot.id
      })
    });

    const data = await response.json();
    if (!data.stored && data.output) {
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          body: data.output,
          created_at: new Date().toISOString(),
          sender_id: bot.id,
          is_bot: true
        }
      ]);
    }
  };

  useEffect(() => {
    if (mode !== 'demo') return undefined;

    const stopSimulation = createSimulatedDiscoverStream({
      onEntry: (incoming) => {
        if (!incoming || incoming.id === profile?.id || blockedIds.has(incoming.id)) return;
        setDiscover((prev) => mergeDiscoverEntry(prev, incoming));
      }
    });

    return stopSimulation;
  }, [mode, profile?.id, blockedIds]);

  useEffect(() => {
    if (mode === 'demo' || !supabase || !profile) return undefined;

    return subscribeToDiscoverEntries({
      supabase,
      viewerId: profile.id,
      onEntry: (incoming) => {
        if (!incoming || blockedIds.has(incoming.id)) return;
        setDiscover((prev) => mergeDiscoverEntry(prev, incoming));
      }
    });
  }, [mode, profile?.id, blockedIds]);

  useEffect(() => {
    if (mode === 'demo' || !supabase || !profile) return undefined;

    const handleMatchChange = () => {
      refreshMatches();
    };

    const channel = supabase
      .channel(`matches-${profile.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `user_a=eq.${profile.id}` },
        handleMatchChange
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `user_b=eq.${profile.id}` },
        handleMatchChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mode, profile?.id]);

  useEffect(() => {
    if (mode === 'demo' || !supabase || !selectedMatchId) return undefined;

    const channel = supabase
      .channel(`messages-${selectedMatchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${selectedMatchId}` },
        (payload) => {
          const incoming = payload.new;
          setMessages((prev) => {
            if (prev.some((message) => message.id === incoming.id)) return prev;
            const next = [...prev, incoming];
            next.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mode, selectedMatchId]);

  useEffect(() => {
    if (mode === 'demo' || !supabase || !selectedMatchId) return undefined;

    const channel = supabase
      .channel(`date-intents-${selectedMatchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'date_intents', filter: `match_id=eq.${selectedMatchId}` },
        () => {
          loadDateStatus([selectedMatchId]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mode, selectedMatchId]);

  useEffect(() => {
    if (mode === 'demo' || !supabase || !selectedMatchId) return undefined;

    const channel = supabase
      .channel(`flow-${selectedMatchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_flow_state', filter: `match_id=eq.${selectedMatchId}` },
        (payload) => {
          const nextStage = payload.new?.stage ?? 0;
          setFlowStageByMatch((prev) => ({
            ...prev,
            [selectedMatchId]: nextStage
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mode, selectedMatchId]);

  useEffect(() => {
    if (!selectedMatchId || !selectedPartner?.is_bot) return undefined;

    const state = botAutoState[selectedMatchId] || {};
    const lastMessage = messages[messages.length - 1];

    if (!messages.length && !state.openerSent) {
      setBotAutoState((prev) => ({
        ...prev,
        [selectedMatchId]: { ...state, openerSent: true }
      }));
      sendBotAutonomousMessage(selectedMatchId, selectedPartner, 'opener');
    }

    if (lastMessage && lastMessage.sender_id === selectedPartner.id && !state.followUpSent) {
      const lastTime = new Date(lastMessage.created_at).getTime();
      const delay = Math.max(0, BOT_FOLLOWUP_DELAY_MS - (Date.now() - lastTime));

      const timer = setTimeout(() => {
        const latestMessages = messagesRef.current;
        const latestLast = latestMessages[latestMessages.length - 1];
        const partner = selectedPartnerRef.current;
        const match = selectedMatchRef.current;
        const stateNow = botAutoRef.current[selectedMatchId] || {};

        if (!match || !partner?.is_bot) return;
        if (stateNow.followUpSent) return;
        if (!latestLast || latestLast.sender_id !== partner.id) return;

        setBotAutoState((prev) => ({
          ...prev,
          [selectedMatchId]: { ...(prev[selectedMatchId] || {}), followUpSent: true }
        }));
        sendBotAutonomousMessage(match.id, partner, 'followUp');
      }, delay);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [selectedMatchId, selectedPartner?.id, messages, botAutoState]);

  const handleAuthChange = (field, value) => {
    setAuthForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignIn = async () => {
    if (!supabase) return;
    setAuthError('');
    setAuthMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email: authForm.email,
      password: authForm.password
    });

    if (error) setAuthError(error.message);
  };

  const handleSignUp = async () => {
    if (!supabase) return;
    setAuthError('');
    setAuthMessage('');

    const { error } = await supabase.auth.signUp({
      email: authForm.email,
      password: authForm.password
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setAuthMessage('Check your inbox to confirm, then sign in.');
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const handleProfileDraft = (field, value) => {
    setProfileDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarProviderChange = (value) => {
    const next = value === 'openai' ? 'openai' : 'gemini';
    setAvatarProvider(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AVATAR_PROVIDER_STORAGE_KEY, next);
    }
    setAvatarError('');
    setAvatarStatus('');
  };

  const normalizeAvatarSource = (source) => ({
    id: source?.id || null,
    display_name: `${source?.display_name || ''}`.trim(),
    pronouns: `${source?.pronouns || ''}`.trim() || 'they/them',
    bio: `${source?.bio || ''}`.trim()
  });

  const handleUseProfileDataForAvatar = (source) => {
    if (!source) {
      setAvatarSourceProfile(null);
      const nextPrompt = buildAvatarPrompt({
        displayName: selfAvatarSource.display_name,
        pronouns: selfAvatarSource.pronouns,
        bio: selfAvatarSource.bio,
        interview: avatarInterview
      });
      setAvatarPrompt(nextPrompt);
      setAvatarError('');
      setAvatarStatus('Using your profile data for avatar prompt.');
      return;
    }

    const nextSource = normalizeAvatarSource(source);
    setAvatarSourceProfile(nextSource);
    const nextPrompt = buildAvatarPrompt({
      displayName: nextSource.display_name,
      pronouns: nextSource.pronouns,
      bio: nextSource.bio,
      interview: avatarInterview
    });
    setAvatarPrompt(nextPrompt);
    setAvatarError('');
    setAvatarStatus(`Using ${nextSource.display_name || 'selected profile'} data for avatar prompt.`);
  };

  const handleGeminiApiKeyChange = (value) => {
    setGeminiApiKey(value);
    setAvatarError('');
    setAvatarStatus('');
  };

  const handleOpenAIApiKeyChange = (value) => {
    setOpenaiApiKey(value);
    setAvatarError('');
    setAvatarStatus('');
  };

  const saveGeminiApiKey = (nextValue = geminiApiKey) => {
    const trimmed = `${nextValue || ''}`.trim();
    if (typeof window !== 'undefined') {
      if (trimmed) {
        window.localStorage.setItem(GEMINI_KEY_STORAGE_KEY, trimmed);
      } else {
        window.localStorage.removeItem(GEMINI_KEY_STORAGE_KEY);
      }
    }
    setGeminiApiKey(trimmed);
    setAvatarError('');
    setAvatarStatus(trimmed ? 'Gemini key saved in localStorage.' : 'Gemini key removed from localStorage.');
    return trimmed;
  };

  const saveOpenAIApiKey = (nextValue = openaiApiKey) => {
    const trimmed = `${nextValue || ''}`.trim();
    if (typeof window !== 'undefined') {
      if (trimmed) {
        window.localStorage.setItem(OPENAI_KEY_STORAGE_KEY, trimmed);
      } else {
        window.localStorage.removeItem(OPENAI_KEY_STORAGE_KEY);
      }
    }
    setOpenaiApiKey(trimmed);
    setAvatarError('');
    setAvatarStatus(trimmed ? 'OpenAI key saved in localStorage.' : 'OpenAI key removed from localStorage.');
    return trimmed;
  };

  const promptForApiKey = (provider) => {
    if (typeof window === 'undefined') return '';
    const providerName = provider === 'openai' ? 'OpenAI' : 'Gemini';
    const entered = window.prompt(`Paste your ${providerName} API key. It will be saved in localStorage on this device.`);
    const trimmed = `${entered || ''}`.trim();
    if (!trimmed) return '';
    return provider === 'openai' ? saveOpenAIApiKey(trimmed) : saveGeminiApiKey(trimmed);
  };

  const handleAvatarPromptChange = (value) => {
    setAvatarPrompt(value);
    setAvatarError('');
    setAvatarStatus('');
  };

  const handleAvatarInterviewChange = (field, value) => {
    setAvatarInterview((prev) => ({ ...prev, [field]: value }));
    setAvatarError('');
    setAvatarStatus('');
  };

  const handleBuildAvatarPromptFromInterview = () => {
    const nextPrompt = buildAvatarPrompt({
      displayName: activeAvatarSource.display_name,
      pronouns: activeAvatarSource.pronouns,
      bio: activeAvatarSource.bio,
      interview: avatarInterview
    });

    setAvatarPrompt(nextPrompt);
    setAvatarError('');
    setAvatarStatus('Prompt built from interview answers.');
    return nextPrompt;
  };

  const handleGenerateProfileAvatar = async (promptOverride = '') => {
    const provider = avatarProvider === 'openai' ? 'openai' : 'gemini';
    const providerName = provider === 'openai' ? 'OpenAI' : 'Gemini';
    const storedKey = provider === 'openai' ? openaiApiKey : geminiApiKey;
    let activeApiKey = `${storedKey || ''}`.trim();
    if (!activeApiKey) {
      activeApiKey = promptForApiKey(provider);
    }

    if (!activeApiKey) {
      setAvatarError(`A ${providerName} API key is required to generate an avatar.`);
      return;
    }

    const prompt = `${promptOverride || avatarPrompt || ''}`.trim() || buildAvatarPrompt({
      displayName: activeAvatarSource.display_name,
      pronouns: activeAvatarSource.pronouns,
      bio: activeAvatarSource.bio,
      interview: avatarInterview
    });

    if (!prompt) {
      setAvatarError('Write a prompt for the profile image.');
      return;
    }

    setIsAvatarBusy(true);
    setAvatarError('');
    setAvatarStatus('');

    try {
      const response = await fetch('/api/generate-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: activeApiKey,
          prompt
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        const availableModels = Array.isArray(payload?.availableModels) && payload.availableModels.length
          ? ` Available models: ${payload.availableModels.join(', ')}.`
          : '';
        throw new Error(`${payload?.error || `${providerName} avatar generation failed.`}${availableModels}`);
      }

      const nextAvatarUrl = payload?.imageDataUrl;
      if (!nextAvatarUrl) {
        throw new Error(`${providerName} returned no image.`);
      }

      if (mode !== 'demo' && supabase && profile?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: nextAvatarUrl })
          .eq('id', profile.id);

        if (error) {
          throw new Error(error.message);
        }
      }

      setProfileDraft((prev) => ({ ...prev, avatar_url: nextAvatarUrl }));
      setProfile((prev) => (prev ? { ...prev, avatar_url: nextAvatarUrl } : prev));
      setAvatarStatus(`Profile image generated with ${providerName}.`);
    } catch (error) {
      setAvatarError(error?.message || 'Avatar generation failed.');
    } finally {
      setIsAvatarBusy(false);
    }
  };

  const handleGenerateAvatarFromInterview = async () => {
    const interviewPrompt = handleBuildAvatarPromptFromInterview();
    await handleGenerateProfileAvatar(interviewPrompt);
  };

  const handleProfileSave = async () => {
    if (!supabase || !session) return;
    setAuthError('');
    if (!profileDraft.age_verified) {
      setAuthError('Confirm you are 18+ to continue.');
      return;
    }
    setIsBusy(true);
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      display_name: profileDraft.display_name,
      pronouns: profileDraft.pronouns,
      bio: profileDraft.bio,
      avatar_url: profileDraft.avatar_url,
      is_bot: profileDraft.is_bot,
      age_verified: profileDraft.age_verified
    });

    setIsBusy(false);
    if (error) {
      setAuthError(error.message);
      return;
    }

    setNeedsProfile(false);
    setProfile({
      id: session.user.id,
      display_name: profileDraft.display_name,
      pronouns: profileDraft.pronouns,
      bio: profileDraft.bio,
      avatar_url: profileDraft.avatar_url,
      is_bot: profileDraft.is_bot,
      age_verified: profileDraft.age_verified
    });
  };

  const handleAgeGateConfirm = async () => {
    if (!ageGateChecked) {
      setAgeGateError('Confirm you are 18+ to enter.');
      return;
    }

    setAgeGateError('');
    setAgeGateOpen(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AGE_STORAGE_KEY, 'true');
    }

    setProfileDraft((prev) => ({ ...prev, age_verified: true }));

    if (supabase && profile && !profile.age_verified) {
      await supabase.from('profiles').update({ age_verified: true }).eq('id', profile.id);
      setProfile((prev) => (prev ? { ...prev, age_verified: true } : prev));
    }
  };

  const handleAgeGateToggle = (value) => {
    setAgeGateChecked(value);
    setAgeGateError('');
  };

  const handleBlock = async (target) => {
    if (!target || !profile) return;

    if (mode === 'demo') {
      setBlocks((prev) => [...prev, { blocker_id: profile.id, blocked_id: target.id }]);
      setDiscover((prev) => prev.filter((item) => item.id !== target.id));
      setMatches((prev) => prev.filter((match) => match.other?.id !== target.id));
      if (selectedPartner?.id === target.id) {
        setSelectedMatchId(null);
        setMessages([]);
      }
      return;
    }

    const { error } = await supabase.from('blocks').insert({
      blocker_id: profile.id,
      blocked_id: target.id
    });

    if (!error) {
      const nextBlocks = await loadBlocks();
      const blockSet = new Set(nextBlocks.map((block) => block.blocked_id));
      await loadDiscover(blockSet);
      await loadMatches(blockSet);
      if (selectedPartner?.id === target.id) {
        setSelectedMatchId(null);
        setMessages([]);
      }
    }
  };

  const openReport = (target) => {
    setReportTarget(target);
    setReportReason(REPORT_REASONS[0].value);
    setReportNotes('');
  };

  const submitReport = async (alsoBlock) => {
    if (!reportTarget || !profile) return;

    if (mode === 'demo') {
      if (alsoBlock) handleBlock(reportTarget);
      setReportTarget(null);
      return;
    }

    await supabase.from('reports').insert({
      reporter_id: profile.id,
      reported_id: reportTarget.id,
      reason: reportReason,
      notes: reportNotes || null
    });

    if (alsoBlock) {
      await handleBlock(reportTarget);
    }

    setReportTarget(null);
    setReportNotes('');
  };

  const logConsent = async (matchId, action) => {
    if (mode === 'demo' || !supabase || !profile || !matchId) return;
    await supabase.from('consent_logs').insert({
      match_id: matchId,
      user_id: profile.id,
      action
    });
  };

  const handleFlirt = async (target) => {
    if (!profile || isBusy) return;
    setIsBusy(true);

    if (mode === 'demo') {
      setDiscover((prev) => prev.filter((item) => item.id !== target.id));
      setMatches((prev) => {
        const exists = prev.find((match) => match.other?.id === target.id);
        if (exists) return prev;
        const next = {
          id: `demo-${target.id}`,
          user_a: profile.id,
          user_b: target.id,
          created_at: new Date().toISOString(),
          date_room: null,
          date_started_at: null,
          other: target
        };
        return [next, ...prev];
      });
      setDateStatus((prev) => ({
        ...prev,
        [`demo-${target.id}`]: { selfReady: false, otherReady: true }
      }));
      setIsBusy(false);
      return;
    }

    try {
      await supabase
        .from('swipes')
        .upsert({
          swiper_id: profile.id,
          target_id: target.id,
          direction: 'like'
        });

      const { data: reciprocal } = await supabase
        .from('swipes')
        .select('id')
        .eq('swiper_id', target.id)
        .eq('target_id', profile.id)
        .eq('direction', 'like')
        .maybeSingle();

      if (reciprocal) {
        const [user_a, user_b] = [profile.id, target.id].sort();
        await supabase.from('matches').upsert({ user_a, user_b });
      }

      await loadMatches();
      await loadDiscover();
    } finally {
      setIsBusy(false);
    }
  };

  const handlePass = (target) => {
    setDiscover((prev) => prev.filter((item) => item.id !== target.id));
  };

  const rateDiscoverEntry = (entryId, side) => {
    if (!entryId || (side !== 'human' && side !== 'bot')) return;

    setDiscoverRatings((prev) => {
      const current = prev[entryId] || DEFAULT_DISCOVER_RATING;
      const delta = side === 'human' ? DISCOVER_RATING_STEP : -DISCOVER_RATING_STEP;
      const human = Math.min(100, Math.max(0, current.human + delta));

      return {
        ...prev,
        [entryId]: {
          human,
          bot: 100 - human
        }
      };
    });
  };

  const toggleTrackDiscover = (entryId) => {
    if (!entryId) return;
    setTrackedDiscoverIds((prev) =>
      prev.includes(entryId) ? prev.filter((id) => id !== entryId) : [entryId, ...prev]
    );
  };

  const handleSelectMatch = (matchId) => {
    setSelectedMatchId(matchId);
    if (mode === 'demo') {
      setMessages(demoMessages[matchId] || []);
    }
  };

  const appendDemoMessage = (matchId, message) => {
    setDemoMessages((prev) => {
      const next = {
        ...prev,
        [matchId]: [...(prev[matchId] || []), message]
      };
      setMessages(next[matchId]);
      return next;
    });
  };

  const advanceFlowStage = async (matchId) => {
    if (!matchId) return;
    const currentStage = flowStageByMatch[matchId] ?? 0;
    const nextStage = Math.min(currentStage + 1, flowStages.length - 1);

    setFlowStageByMatch((prev) => ({
      ...prev,
      [matchId]: nextStage
    }));

    if (mode === 'demo' || !supabase || !profile) return;

    await supabase.from('match_flow_state').upsert({
      match_id: matchId,
      stage: nextStage,
      updated_by: profile.id,
      updated_at: new Date().toISOString()
    });
  };

  const ensureDemoMatch = (responder) => {
    const existing = matches.find((match) => match.other?.id === responder.id);
    if (existing) return existing;
    const next = {
      id: `demo-${responder.id}`,
      user_a: profile.id,
      user_b: responder.id,
      created_at: new Date().toISOString(),
      date_room: null,
      date_started_at: null,
      other: responder
    };
    setMatches((prev) => [next, ...prev]);
    setFlowStageByMatch((prev) => ({ ...prev, [next.id]: 0 }));
    setDateStatus((prev) => ({
      ...prev,
      [next.id]: { selfReady: false, otherReady: responder.is_bot }
    }));
    return next;
  };

  const ensureMatchWithResponder = async (responder) => {
    if (!supabase || !profile) return null;
    const [user_a, user_b] = [profile.id, responder.id].sort();
    const { data, error } = await supabase
      .from('matches')
      .upsert({ user_a, user_b }, { onConflict: 'user_a,user_b' })
      .select('*')
      .maybeSingle();

    if (!error && data?.id) {
      const { data: flowRow } = await supabase
        .from('match_flow_state')
        .select('match_id')
        .eq('match_id', data.id)
        .maybeSingle();

      if (!flowRow) {
        await supabase.from('match_flow_state').upsert({
          match_id: data.id,
          stage: 0,
          updated_by: profile.id
        });
      }
      return data.id;
    }

    const { data: existing } = await supabase
      .from('matches')
      .select('*')
      .eq('user_a', user_a)
      .eq('user_b', user_b)
      .maybeSingle();

    if (existing?.id) {
      const { data: flowRow } = await supabase
        .from('match_flow_state')
        .select('match_id')
        .eq('match_id', existing.id)
        .maybeSingle();

      if (!flowRow) {
        await supabase.from('match_flow_state').upsert({
          match_id: existing.id,
          stage: 0,
          updated_by: profile.id
        });
      }
      return existing.id;
    }

    return null;
  };

  const handleSparkFind = () => {
    if (!sparkInput.trim()) {
      setSparkError('Write a response to find your closest matches.');
      return;
    }
    setSparkError('');
    const ranked = rankRespondersWithFilter(sparkInput, responderPool, responderFilter, SPARK_RESULT_LIMIT);
    setSparkResults(ranked);
  };

  const handleNextSpark = () => {
    setSparkIndex((prev) => (prev + 1) % sparkLines.length);
    setSparkInput('');
    setSparkResults([]);
    setSparkError('');
  };

  const handleSparkStart = async (responder) => {
    if (!sparkInput.trim() || !responder) return;

    const body = sparkInput.trim();
    setSparkInput('');
    setSparkResults([]);

    if (mode === 'demo') {
      const match = ensureDemoMatch(responder);
      setSelectedMatchId(match.id);
      appendDemoMessage(match.id, {
        id: `demo-${Date.now()}`,
        body,
        created_at: new Date().toISOString(),
        sender_id: profile.id,
        is_bot: false
      });

      if (responder.is_bot) {
        const reply = demoQuickReplies[Math.floor(Math.random() * demoQuickReplies.length)];
        setTimeout(() => {
          appendDemoMessage(match.id, {
            id: `demo-${Date.now()}-bot`,
            body: reply,
            created_at: new Date().toISOString(),
            sender_id: responder.id,
            is_bot: true
          });
        }, 600);
      }
      return;
    }

    const matchId = await ensureMatchWithResponder(responder);
    if (!matchId) return;

    setSelectedMatchId(matchId);
    await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: profile.id,
      body,
      is_bot: false
    });

    if (responder.is_bot) {
      await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: body,
          history: `Spark: ${currentSpark.text}`,
          botName: responder.display_name,
          matchId,
          botId: responder.id
        })
      });
    }

    await refreshMatches();
  };

  const sendMessage = async (body, options = {}) => {
    if (!body.trim() || !selectedMatch || !profile) return;
    const { advanceFlow = false } = options;

    if (mode === 'demo') {
      const newMessage = {
        id: `demo-${Date.now()}`,
        body,
        created_at: new Date().toISOString(),
        sender_id: profile.id,
        is_bot: false
      };
      appendDemoMessage(selectedMatch.id, newMessage);

      if (advanceFlow) {
        await advanceFlowStage(selectedMatch.id);
      }

      if (selectedPartner?.is_bot) {
        const reply = demoQuickReplies[Math.floor(Math.random() * demoQuickReplies.length)];
        setTimeout(() => {
          appendDemoMessage(selectedMatch.id, {
            id: `demo-${Date.now()}-bot`,
            body: reply,
            created_at: new Date().toISOString(),
            sender_id: selectedPartner.id,
            is_bot: true
          });
        }, 600);
      }
      return;
    }

    const history = [...messages.slice(-6), { body, is_bot: false }]
      .map((msg) => `${msg.is_bot ? selectedPartner?.display_name || 'Bot' : 'Human'}: ${msg.body}`)
      .join('\n');

    await supabase.from('messages').insert({
      match_id: selectedMatch.id,
      sender_id: profile.id,
      body,
      is_bot: false
    });

    if (advanceFlow) {
      await advanceFlowStage(selectedMatch.id);
    }

    await loadMessages(selectedMatch.id);

    if (selectedPartner?.is_bot) {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: body,
          history,
          botName: selectedPartner.display_name,
          matchId: selectedMatch.id,
          botId: selectedPartner.id
        })
      });

      const data = await response.json();
      if (!data.stored && data.output) {
        setMessages((prev) => [
          ...prev,
          {
            id: `local-${Date.now()}`,
            body: data.output,
            created_at: new Date().toISOString(),
            sender_id: selectedPartner.id,
            is_bot: true
          }
        ]);
      } else {
        await loadMessages(selectedMatch.id);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const body = chatInput.trim();
    setChatInput('');
    await sendMessage(body);
  };

  const handleSuggestedReply = async (text) => {
    if (!text) return;
    await sendMessage(text, { advanceFlow: true });
  };

  const toggleReady = async () => {
    if (!selectedMatch || !profile) return;

    if (mode === 'demo') {
      setDateStatus((prev) => ({
        ...prev,
        [selectedMatch.id]: {
          ...(prev[selectedMatch.id] || { otherReady: true, selfReady: false }),
          selfReady: !(prev[selectedMatch.id]?.selfReady ?? false)
        }
      }));
      return;
    }

    const currentReady = dateStatus[selectedMatch.id]?.selfReady ?? false;
    await supabase.from('date_intents').upsert({
      match_id: selectedMatch.id,
      user_id: profile.id,
      ready: !currentReady
    });

    await logConsent(selectedMatch.id, currentReady ? 'ready_off' : 'ready_on');
    await loadDateStatus([selectedMatch.id]);
  };

  const startDate = async () => {
    if (!selectedMatch || !selectedPartner) return;

    const nextRoom = selectedMatch.date_room || buildRoomName(selectedMatch.id);
    const nextStart = selectedMatch.date_started_at || new Date().toISOString();

    if (mode === 'demo') {
      setMatches((prev) =>
        prev.map((match) =>
          match.id === selectedMatch.id
            ? { ...match, date_room: nextRoom, date_started_at: nextStart }
            : match
        )
      );
      return;
    }

    await supabase
      .from('matches')
      .update({ date_room: nextRoom, date_started_at: nextStart })
      .eq('id', selectedMatch.id);

    await logConsent(selectedMatch.id, 'date_started');
    await loadMatches();
  };

  const enterDemoMode = () => {
    setMode('demo');
  };

  return {
    mode,
    needsProfile,
    profile,
    discover,
    discoverRatings,
    trackedDiscoverIds,
    matches,
    selectedMatchId,
    selectedMatch,
    selectedPartner,
    selectedStatus,
    messages,
    authForm,
    authMessage,
    authError,
    profileDraft,
    avatarSourceName,
    isUsingExternalAvatarSource,
    avatarProvider,
    geminiApiKey,
    openaiApiKey,
    avatarPrompt,
    avatarInterview,
    avatarError,
    avatarStatus,
    isAvatarBusy,
    chatInput,
    isBusy,
    sparkInput,
    sparkResults,
    sparkError,
    sparkIndex,
    responderFilter,
    currentSpark,
    sparkAuthor,
    currentFlowStage,
    currentFlowStageIndex,
    ageGateOpen,
    ageGateChecked,
    ageGateError,
    reportTarget,
    reportReason,
    reportNotes,
    constants: {
      reportReasons: REPORT_REASONS,
      flowStages,
      dateDurationMs: DATE_DURATION_MS
    },
    actions: {
      enterDemoMode,
      handleAuthChange,
      handleSignIn,
      handleSignUp,
      handleSignOut,
      handleProfileDraft,
      handleProfileSave,
      handleUseProfileDataForAvatar,
      handleAvatarProviderChange,
      handleGeminiApiKeyChange,
      handleOpenAIApiKeyChange,
      saveGeminiApiKey,
      saveOpenAIApiKey,
      handleAvatarPromptChange,
      handleAvatarInterviewChange,
      handleBuildAvatarPromptFromInterview,
      handleGenerateAvatarFromInterview,
      handleGenerateProfileAvatar,
      handleFlirt,
      handlePass,
      rateDiscoverEntry,
      toggleTrackDiscover,
      handleSelectMatch,
      handleSendMessage,
      setChatInput,
      handleSuggestedReply,
      toggleReady,
      startDate,
      handleSparkFind,
      handleSparkStart,
      handleNextSpark,
      setSparkInput,
      setResponderFilter,
      handleAgeGateConfirm,
      handleAgeGateToggle,
      openReport,
      setReportReason,
      setReportNotes,
      setReportTarget,
      submitReport,
      handleBlock
    },
    helpers: {
      isDateActive
    },
    flags: {
      isSupabaseConfigured
    }
  };
}
