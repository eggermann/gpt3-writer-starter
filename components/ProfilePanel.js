import { useEffect, useMemo, useRef, useState } from 'react';
import { DISCOVER_PAGE_SIZE, sortDiscoverEntriesNewestFirst } from '../lib/discoverFeed';
import styles from './ProfilePanel.module.scss';

const DEFAULT_RATING = { human: 0, bot: 100 };
const cx = (...classNames) => classNames.filter(Boolean).join(' ');

export default function ProfilePanel({
  profile,
  discover,
  discoverRatings,
  trackedDiscoverIds,
  avatarType,
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
  onFlirt,
  onPass,
  onBlock,
  onRateDiscover,
  onToggleTrackDiscover,
  onUseProfileDataForAvatar,
  onAvatarTypeChange,
  onAvatarProviderChange,
  onGeminiApiKeyChange,
  onOpenAIApiKeyChange,
  onSaveGeminiApiKey,
  onSaveOpenAIApiKey,
  onAvatarPromptChange,
  onAvatarInterviewChange,
  onBuildAvatarPrompt,
  onGenerateAvatarFromInterview,
  onGenerateAvatar
}) {
  const [visibleCount, setVisibleCount] = useState(DISCOVER_PAGE_SIZE);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [animatedIds, setAnimatedIds] = useState([]);
  const listRef = useRef(null);
  const previousIdsRef = useRef([]);
  const hasMountedRef = useRef(false);

  const sortedDiscover = useMemo(() => sortDiscoverEntriesNewestFirst(discover || []), [discover]);
  const prioritizedDiscover = useMemo(() => {
    if (!trackedDiscoverIds?.length) return sortedDiscover;

    const trackedSet = new Set(trackedDiscoverIds);
    const tracked = [];
    const others = [];

    sortedDiscover.forEach((entry) => {
      if (trackedSet.has(entry.id)) {
        tracked.push(entry);
      } else {
        others.push(entry);
      }
    });

    return [...tracked, ...others];
  }, [sortedDiscover, trackedDiscoverIds]);

  const visibleDiscover = prioritizedDiscover.slice(0, visibleCount);
  const hasMoreDiscover = prioritizedDiscover.length > visibleCount;
  const getRating = (entryId) => discoverRatings?.[entryId] || DEFAULT_RATING;
  const isTracked = (entryId) => trackedDiscoverIds?.includes(entryId);
  const selectedProvider = (avatarType || avatarProvider || 'openai') === 'gemini' ? 'gemini' : 'openai';
  const providerName = selectedProvider === 'openai' ? 'OpenAI' : 'Gemini';
  const keyValue = selectedProvider === 'openai' ? openaiApiKey : geminiApiKey;
  const keyPlaceholder = selectedProvider === 'openai' ? 'sk-proj-...' : 'AIza...';

  useEffect(() => {
    setVisibleCount((prev) => {
      if (prioritizedDiscover.length <= DISCOVER_PAGE_SIZE) return DISCOVER_PAGE_SIZE;
      return Math.min(Math.max(prev, DISCOVER_PAGE_SIZE), prioritizedDiscover.length);
    });
  }, [prioritizedDiscover.length]);

  useEffect(() => {
    const currentIds = prioritizedDiscover.map((item) => item.id);

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      previousIdsRef.current = currentIds;
      return undefined;
    }

    const previousIds = new Set(previousIdsRef.current);
    const incomingIds = currentIds.filter((id) => !previousIds.has(id));
    previousIdsRef.current = currentIds;

    if (!incomingIds.length) return undefined;

    setAnimatedIds((prev) => Array.from(new Set([...prev, ...incomingIds])));
    if (listRef.current && typeof listRef.current.scrollTo === 'function') {
      listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const timer = setTimeout(() => {
      setAnimatedIds((prev) => prev.filter((id) => !incomingIds.includes(id)));
    }, 700);

    return () => clearTimeout(timer);
  }, [prioritizedDiscover]);

  useEffect(() => {
    if (!trackedDiscoverIds?.length) return;
    if (!listRef.current || typeof listRef.current.scrollTo !== 'function') return;
    listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }, [trackedDiscoverIds]);

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h3>Your profile</h3>
        <span className="chip">{profile?.is_bot ? 'Bot' : 'Human'}</span>
      </div>
      <div className={styles.profileCard}>
        <div className={styles.profileCardMedia} style={{ backgroundImage: `url(${profile?.avatar_url})` }} />
        <div className={styles.profileCardBody}>
          <h4>{profile?.display_name}</h4>
          <p className="muted">{profile?.pronouns}</p>
          <p>{profile?.bio}</p>
          {isUsingExternalAvatarSource && (
            <button
              type="button"
              className={cx('btn ghost', styles.avatarSourceBtn)}
              onClick={() => onUseProfileDataForAvatar?.(null)}
            >
              Use my profile as source
            </button>
          )}
        </div>
      </div>
      <div className={styles.avatarLab}>
        <h4>AI profile image</h4>
        <p className={cx('muted', styles.avatarHint)}>Short interview to icon-style prompt to avatar. Key is saved in localStorage.</p>
        <p className={cx('muted', styles.avatarSource)}>Source profile: {avatarSourceName}</p>
        <label className={styles.avatarProvider}>
          Image provider
          <select
            value={selectedProvider}
            onChange={(event) => {
              onAvatarTypeChange?.(event.target.value);
              onAvatarProviderChange?.(event.target.value);
            }}
          >
            <option value="gemini">Gemini</option>
            <option value="openai">OpenAI</option>
          </select>
        </label>
        <div className={styles.avatarInterview}>
          <label>
            Bot style
            <select
              value={avatarInterview?.archetype || 'friendly'}
              onChange={(event) => onAvatarInterviewChange?.('archetype', event.target.value)}
            >
              <option value="friendly">Friendly mascot</option>
              <option value="sleek">Sleek futurist</option>
              <option value="retro">Retro arcade</option>
              <option value="abstract">Abstract emblem</option>
            </select>
          </label>
          <label>
            Composition
            <select
              value={avatarInterview?.composition || 'headshot'}
              onChange={(event) => onAvatarInterviewChange?.('composition', event.target.value)}
            >
              <option value="headshot">Head icon</option>
              <option value="bust">Bust portrait</option>
              <option value="full">Full body</option>
              <option value="emblem">Badge emblem</option>
            </select>
          </label>
          <label>
            Palette
            <select
              value={avatarInterview?.palette || 'cyan-red'}
              onChange={(event) => onAvatarInterviewChange?.('palette', event.target.value)}
            >
              <option value="cyan-red">Cyan + red</option>
              <option value="yellow-blue">Yellow + blue</option>
              <option value="pink-pop">Pink pop</option>
              <option value="mono">Mono + accent</option>
            </select>
          </label>
          <label>
            Expression
            <select
              value={avatarInterview?.expression || 'playful'}
              onChange={(event) => onAvatarInterviewChange?.('expression', event.target.value)}
            >
              <option value="playful">Playful</option>
              <option value="calm">Calm</option>
              <option value="bold">Bold</option>
              <option value="curious">Curious</option>
            </select>
          </label>
          <label>
            Motif
            <select
              value={avatarInterview?.motif || 'heart-core'}
              onChange={(event) => onAvatarInterviewChange?.('motif', event.target.value)}
            >
              <option value="heart-core">Heart core</option>
              <option value="signals">Signal dots</option>
              <option value="split">Split duality</option>
              <option value="minimal">Minimal face</option>
            </select>
          </label>
          <label>
            Background
            <select
              value={avatarInterview?.background || 'flat'}
              onChange={(event) => onAvatarInterviewChange?.('background', event.target.value)}
            >
              <option value="flat">Flat color</option>
              <option value="gradient">Soft gradient</option>
              <option value="ring">Badge ring</option>
              <option value="textured">Textured grain</option>
            </select>
          </label>
        </div>
        <div className={styles.avatarActions}>
          <button type="button" className="btn ghost" onClick={() => onBuildAvatarPrompt?.()}>
            Build prompt
          </button>
          <button
            type="button"
            className="btn outline"
            onClick={() => onGenerateAvatarFromInterview?.()}
            disabled={isAvatarBusy}
          >
            {isAvatarBusy ? 'Generating…' : 'Generate from interview'}
          </button>
        </div>
        <label>
          {providerName} API key
          <input
            type="password"
            value={keyValue}
            placeholder={keyPlaceholder}
            autoComplete="off"
            onChange={(event) =>
              selectedProvider === 'openai'
                ? onOpenAIApiKeyChange?.(event.target.value)
                : onGeminiApiKeyChange?.(event.target.value)
            }
          />
        </label>
        <label>
          Image prompt
          <textarea
            rows="3"
            value={avatarPrompt}
            onChange={(event) => onAvatarPromptChange?.(event.target.value)}
          />
        </label>
        <div className={styles.avatarActions}>
          <button
            type="button"
            className="btn ghost"
            onClick={() => (selectedProvider === 'openai' ? onSaveOpenAIApiKey?.() : onSaveGeminiApiKey?.())}
          >
            Save key
          </button>
          <button type="button" className="btn primary" onClick={() => onGenerateAvatar?.()} disabled={isAvatarBusy}>
            {isAvatarBusy ? 'Generating…' : 'Generate image'}
          </button>
        </div>
        {avatarStatus && <p className="status status--success">{avatarStatus}</p>}
        {avatarError && <p className="status status--error">{avatarError}</p>}
      </div>

      <div className={cx(styles.panelHeader, styles.panelHeaderTight)}>
        <h3>Discover</h3>
        <button type="button" className={styles.discoverToggle} onClick={() => setIsCollapsed((prev) => !prev)}>
          {isCollapsed ? 'New entries (expand)' : 'New entries (collapse)'}
        </button>
      </div>
      <div className={cx(styles.discoverList, isCollapsed && styles.discoverListCollapsed)} ref={listRef}>
        {visibleDiscover.map((item) => (
          <div
            className={cx(isCollapsed ? styles.discoverLine : styles.matchCard, animatedIds.includes(item.id) && styles.isNew)}
            key={item.id}
          >
            {!isCollapsed && (
              <div className={styles.matchCardMedia} style={{ backgroundImage: `url(${item.avatar_url})` }} />
            )}
            <div className={isCollapsed ? styles.discoverLineBody : styles.matchCardBody}>
              <div className={isCollapsed ? styles.discoverLineTitle : styles.matchCardTitle}>
                <h4>{item.display_name}</h4>
                <div className={isCollapsed ? styles.discoverLineMeta : styles.matchCardMeta}>
                  <div className={styles.ratingPill} role="group" aria-label={`Rate ${item.display_name}`}>
                    <button
                      type="button"
                      className={cx(styles.ratingSide, styles.ratingSideHuman)}
                      onClick={() => onRateDiscover?.(item.id, 'human')}
                    >
                      Human {getRating(item.id).human}%
                    </button>
                    <button
                      type="button"
                      className={cx(styles.ratingSide, styles.ratingSideBot)}
                      onClick={() => onRateDiscover?.(item.id, 'bot')}
                    >
                      Bot {getRating(item.id).bot}%
                    </button>
                  </div>
                  <button
                    type="button"
                    className={cx(styles.trackLock, isTracked(item.id) && styles.trackLockTracked)}
                    onClick={() => onToggleTrackDiscover?.(item.id)}
                    aria-label={isTracked(item.id) ? `Stop tracking ${item.display_name}` : `Track ${item.display_name}`}
                    title={isTracked(item.id) ? 'Tracking enabled' : 'Track user'}
                  >
                    <span aria-hidden="true">{isTracked(item.id) ? '🔒' : '🔓'}</span>
                  </button>
                </div>
              </div>
              {!isCollapsed && (
                <>
                  <p className="muted">{item.pronouns}</p>
                  <p>{item.bio}</p>
                  <div className={styles.matchCardActions}>
                    <button className="btn primary" onClick={() => onFlirt(item)}>
                      Flirt
                    </button>
                    <button className="btn ghost" onClick={() => onPass(item)}>
                      Pass
                    </button>
                    <button className="btn outline" onClick={() => onBlock(item)}>
                      Block
                    </button>
                    <button className="btn ghost" onClick={() => onUseProfileDataForAvatar?.(item)}>
                      Use for avatar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        {!prioritizedDiscover.length && <p className="muted">No more profiles. Check back soon.</p>}
      </div>
      {hasMoreDiscover && (
        <div className={styles.panelFooter}>
          <button className="btn ghost" onClick={() => setVisibleCount((prev) => prev + DISCOVER_PAGE_SIZE)}>
            More ({prioritizedDiscover.length - visibleCount})
          </button>
        </div>
      )}
    </section>
  );
}
