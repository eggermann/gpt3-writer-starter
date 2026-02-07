const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const OPENAI_IMAGE_API_URL = 'https://api.openai.com/v1/images/generations';
const PREFERRED_IMAGE_MODELS = [
  'gemini-3-pro-image-preview',
  'gemini-2.5-flash-image',
  'gemini-2.0-flash-preview-image-generation',
  'gemini-2.0-flash-exp-image-generation'
];

const SYSTEM_PROMPT = [
  'Create one single 1:1 dating app avatar icon featuring a robot character.',
  'Keep it PG-13, warm, respectful, and non-explicit.',
  'Use bold outlines, simplified geometry, and flat vector-style color blocks.',
  'Do not include text overlays, logos, or watermarks.'
].join(' ');

const extractInlineImage = (payload) => {
  const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    for (const part of parts) {
      const inlineData = part?.inlineData || part?.inline_data;
      if (inlineData?.data) {
        return inlineData;
      }
    }
  }
  return null;
};

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch (_error) {
    return null;
  }
};

const normalizeModelName = (value = '') => value.replace(/^models\//, '');

const supportsGenerateContent = (model) =>
  Array.isArray(model?.supportedGenerationMethods) && model.supportedGenerationMethods.includes('generateContent');

const fetchAvailableModels = async (apiKey) => {
  const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`);
  if (!response.ok) return [];
  const payload = await parseJsonSafe(response);
  return Array.isArray(payload?.models) ? payload.models : [];
};

const buildCandidateModels = (requestedModel, availableModels) => {
  const discovered = availableModels
    .filter((item) => supportsGenerateContent(item))
    .map((item) => normalizeModelName(item.name));

  const discoveredImageish = discovered.filter((name) => /image|imagen/i.test(name));
  const ordered = [
    normalizeModelName(`${requestedModel || ''}`.trim()),
    ...PREFERRED_IMAGE_MODELS,
    ...discoveredImageish,
    ...discovered
  ].filter(Boolean);

  return Array.from(new Set(ordered));
};

const extractOpenAIImageDataUrl = (payload) => {
  const buckets = [payload?.data, payload?.output].filter(Array.isArray);

  for (const bucket of buckets) {
    for (const entry of bucket) {
      if (entry?.b64_json) {
        return `data:image/png;base64,${entry.b64_json}`;
      }
      if (entry?.image_base64) {
        return `data:image/png;base64,${entry.image_base64}`;
      }
      if (entry?.url) {
        return entry.url;
      }
    }
  }

  return null;
};

const generateAvatarAction = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { provider, apiKey, prompt, model } = req.body || {};
  const selectedProvider = provider === 'openai' ? 'openai' : 'gemini';
  const trimmedKey = `${apiKey || ''}`.trim();
  const trimmedPrompt = `${prompt || ''}`.trim();

  if (!trimmedKey) {
    res.status(400).json({
      error: selectedProvider === 'openai' ? 'Missing OpenAI API key.' : 'Missing Gemini API key.'
    });
    return;
  }

  if (!trimmedPrompt) {
    res.status(400).json({ error: 'Missing avatar prompt.' });
    return;
  }

  const modelPrompt = `${SYSTEM_PROMPT}\n\nUser request: ${trimmedPrompt}`;

  if (selectedProvider === 'openai') {
    const openAiModel = `${model || ''}`.trim() || 'gpt-image-1';
    const openAiResponse = await fetch(OPENAI_IMAGE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${trimmedKey}`
      },
      body: JSON.stringify({
        model: openAiModel,
        prompt: modelPrompt,
        size: '1024x1024'
      })
    });

    const openAiPayload = await parseJsonSafe(openAiResponse);
    if (!openAiResponse.ok) {
      const details = openAiPayload?.error?.message || `OpenAI request failed (${openAiResponse.status}).`;
      res.status(502).json({ error: details });
      return;
    }

    const imageDataUrl = extractOpenAIImageDataUrl(openAiPayload);
    if (!imageDataUrl) {
      res.status(502).json({ error: 'OpenAI returned no image data.' });
      return;
    }

    res.status(200).json({ imageDataUrl, model: openAiModel });
    return;
  }

  const availableModels = await fetchAvailableModels(trimmedKey);
  const candidateModels = buildCandidateModels(model, availableModels);
  let lastError = 'Gemini image generation failed.';

  for (const modelCode of candidateModels) {
    const response = await fetch(
      `${GEMINI_API_URL}/${encodeURIComponent(modelCode)}:generateContent?key=${encodeURIComponent(trimmedKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: modelPrompt }]
          }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE']
          }
        })
      }
    );

    if (response.ok) {
      const payload = await parseJsonSafe(response);
      const imagePart = extractInlineImage(payload);
      if (!imagePart?.data) {
        lastError = `Model ${modelCode} returned no image data.`;
        continue;
      }

      const mimeType = imagePart.mimeType || imagePart.mime_type || 'image/png';
      const imageDataUrl = `data:${mimeType};base64,${imagePart.data}`;
      res.status(200).json({ imageDataUrl, model: modelCode });
      return;
    }

    const errorPayload = await parseJsonSafe(response);
    const details = errorPayload?.error?.message || `Gemini request failed (${response.status}) with ${modelCode}.`;
    lastError = details;

    const isMissingModel = response.status === 404 || /not found|not supported for generateContent/i.test(details);
    if (isMissingModel) {
      continue;
    }

    res.status(502).json({ error: details });
    return;
  }

  const availableModelCodes = availableModels.map((item) => normalizeModelName(item.name)).slice(0, 20);
  res.status(502).json({
    error: `${lastError} No usable image model found for this API key.`,
    availableModels: availableModelCodes
  });
};

export default generateAvatarAction;
