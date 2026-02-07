import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SAFE_PROMPT = `You are a playful, consent-forward dating bot. Keep it PG-13 and warm.\n- Be flirtatious but never explicit or coercive.\n- Ask short, curious questions.\n- Keep replies under 60 words.\n- If the user is uncomfortable, pivot to friendly conversation.`;

const FALLBACK_LINES = [
  'That opener was bold in the best way. What kind of date would you design?'
];

const createServiceClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) return null;
  return createClient(supabaseUrl, serviceKey);
};

const generateAction = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ output: 'Method not allowed' });
    return;
  }

  const { userInput, history, botName, matchId, botId } = req.body || {};
  const trimmedInput = `${userInput || ''}`.trim();

  if (!trimmedInput) {
    res.status(400).json({ output: 'Say something first.' });
    return;
  }

  const prompt = `${SAFE_PROMPT}\n\n${history ? `${history}\n` : ''}Human: ${trimmedInput}\n${botName || 'Bot'}:`;

  const geminiApiKey = process.env.GEMINI_API_KEY;
  let output = FALLBACK_LINES[0];

  if (geminiApiKey) {
    const geminiResponse = await fetch(
      `https://generativeai.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    if (geminiResponse.ok) {
      const geminiData = await geminiResponse.json();
      const candidate = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidate) output = candidate;
    }
  }

  output = output.replace(/<[^>]*>/g, '').trim();

  let stored = false;
  let storedMessage = null;

  if (matchId && botId) {
    const serviceClient = createServiceClient();
    if (serviceClient) {
      const { data, error } = await serviceClient
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: botId,
          body: output,
          is_bot: true
        })
        .select()
        .single();

      if (!error) {
        stored = true;
        storedMessage = data;
      }
    }
  }

  res.status(200).json({ output, stored, message: storedMessage });
};

export default generateAction;
