export const DATE_DURATION_MS = 5 * 60 * 1000;
export const SPARK_RESULT_LIMIT = 20;

export const buildRoomName = (matchId) => `dabon-${matchId}-${Date.now().toString(36)}`;

export const isDateActive = (startedAt, durationMs = DATE_DURATION_MS) => {
  if (!startedAt) return false;
  const startMs = new Date(startedAt).getTime();
  return Date.now() - startMs < durationMs;
};

export const getMatchLabel = (match, profileId) => (match.user_a === profileId ? match.user_b : match.user_a);

export const normalizeText = (value) =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

export const scoreSimilarity = (a, b) => {
  const tokensA = new Set(normalizeText(a));
  const tokensB = new Set(normalizeText(b));
  if (!tokensA.size || !tokensB.size) return 0;
  let intersection = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) intersection += 1;
  });
  const union = tokensA.size + tokensB.size - intersection;
  return union ? intersection / union : 0;
};

export const rankResponders = (input, candidates) =>
  candidates
    .map((candidate) => {
      const descriptor = [
        candidate.display_name,
        candidate.bio,
        candidate.pronouns,
        candidate.vibe
      ]
        .filter(Boolean)
        .join(' ');
      return {
        ...candidate,
        score: scoreSimilarity(input, descriptor)
      };
    })
    .sort((a, b) => b.score - a.score);

export const rankRespondersWithFilter = (input, candidates, filter, limit = SPARK_RESULT_LIMIT) => {
  const bots = candidates.filter((item) => item.is_bot);
  const humans = candidates.filter((item) => !item.is_bot);

  if (filter === 'bots') {
    return rankResponders(input, bots).slice(0, limit);
  }

  if (filter === 'humans') {
    return rankResponders(input, humans).slice(0, limit);
  }

  if (!humans.length) {
    return rankResponders(input, bots).slice(0, limit);
  }

  const rankedHumans = rankResponders(input, humans);
  const rankedBots = rankResponders(input, bots);
  const botSlots = Math.min(rankedBots.length, Math.max(0, Math.round(limit * 0.05)));
  const humanSlots = Math.min(rankedHumans.length, limit - botSlots);

  const results = rankedHumans.slice(0, humanSlots);

  if (botSlots) {
    const insertAt = Math.max(1, Math.floor(results.length * 0.3));
    results.splice(insertAt, 0, ...rankedBots.slice(0, botSlots));
  }

  return results;
};
