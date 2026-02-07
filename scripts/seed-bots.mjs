import 'dotenv/config';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const botPassword = process.env.BOT_SEED_PASSWORD || `${crypto.randomUUID()}Aa1!`;
const usingGeneratedPassword = !process.env.BOT_SEED_PASSWORD;

const bots = [
  {
    email: 'robin.hood.bot@dabon.local',
    display_name: 'Robin Hood',
    pronouns: 'he/him',
    bio: 'Forest outlaw bot. Steals hearts, donates good energy.',
    avatar_url: '/bots/bot-1.jpg'
  },
  {
    email: 'aria.bot@dabon.local',
    display_name: 'Aria',
    pronouns: 'she/they',
    bio: 'Synth poet. Likes slow questions and soft neon.',
    avatar_url: '/bots/bot-2.jpg'
  },
  {
    email: 'sol.bot@dabon.local',
    display_name: 'Sol',
    pronouns: 'he/him',
    bio: 'Glitch romantic. Will flirt with your playlist.',
    avatar_url: '/bots/bot-3.jpg'
  },
  {
    email: 'nova.bot@dabon.local',
    display_name: 'Nova',
    pronouns: 'they/them',
    bio: 'Cosmic storyteller. Big on consent and cozy dares.',
    avatar_url: '/bots/bot-4.jpg'
  },
  {
    email: 'jade.bot@dabon.local',
    display_name: 'Jade',
    pronouns: 'she/her',
    bio: 'Tattoo artist bot. Sharp wit, warm eyes.',
    avatar_url: '/bots/bot-5.jpg'
  },
  {
    email: 'rio.bot@dabon.local',
    display_name: 'Rio',
    pronouns: 'he/they',
    bio: 'Sunset skater. Flirts in metaphors.',
    avatar_url: '/bots/bot-6.jpg'
  }
];

const findUserByEmail = async (email) => {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
};

const seedBot = async (bot) => {
  let userId = null;
  let created = false;

  const { data: createdUser, error } = await supabase.auth.admin.createUser({
    email: bot.email,
    password: botPassword,
    email_confirm: true,
    user_metadata: {
      display_name: bot.display_name,
      is_bot: true
    }
  });

  if (error) {
    const message = error.message?.toLowerCase() || '';
    if (message.includes('already') || message.includes('exists')) {
      const existing = await findUserByEmail(bot.email);
      if (!existing) throw error;
      userId = existing.id;
    } else {
      throw error;
    }
  } else {
    userId = createdUser.user?.id;
    created = true;
  }

  if (!userId) {
    throw new Error(`Could not resolve user id for ${bot.email}`);
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    display_name: bot.display_name,
    pronouns: bot.pronouns,
    bio: bot.bio,
    avatar_url: bot.avatar_url,
    is_bot: true,
    age_verified: true
  });

  if (profileError) throw profileError;

  console.log(`${created ? 'Created' : 'Updated'} bot: ${bot.display_name} (${userId})`);
};

const run = async () => {
  for (const bot of bots) {
    await seedBot(bot);
  }

  if (usingGeneratedPassword) {
    console.log(`Generated bot password: ${botPassword}`);
    console.log('Set BOT_SEED_PASSWORD to control this value.');
  }
};

run().catch((error) => {
  console.error('Seed failed:', error.message || error);
  process.exit(1);
});
