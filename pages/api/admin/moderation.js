import { createClient } from '@supabase/supabase-js';

const parseAdminEmails = () => {
  const raw = process.env.ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

const getBearerToken = (header) => {
  if (!header) return null;
  const parts = header.split(' ');
  if (parts.length !== 2) return null;
  if (parts[0] !== 'Bearer') return null;
  return parts[1];
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: 'Missing access token' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmails = parseAdminEmails();

  if (!supabaseUrl || !anonKey || !serviceKey) {
    res.status(500).json({ error: 'Supabase env vars missing' });
    return;
  }

  if (!adminEmails.length) {
    res.status(403).json({ error: 'Admin access not configured' });
    return;
  }

  const authClient = createClient(supabaseUrl, anonKey);
  const { data: userData, error: userError } = await authClient.auth.getUser(token);

  if (userError || !userData?.user) {
    res.status(401).json({ error: 'Invalid session' });
    return;
  }

  const email = userData.user.email?.toLowerCase();
  if (!email || !adminEmails.includes(email)) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  const serviceClient = createClient(supabaseUrl, serviceKey);

  const { data: reports, error: reportsError } = await serviceClient
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (reportsError) {
    res.status(500).json({ error: reportsError.message });
    return;
  }

  const { data: blocks, error: blocksError } = await serviceClient
    .from('blocks')
    .select('*')
    .order('created_at', { ascending: false });

  if (blocksError) {
    res.status(500).json({ error: blocksError.message });
    return;
  }

  const profileIds = new Set();
  (reports || []).forEach((report) => {
    profileIds.add(report.reporter_id);
    profileIds.add(report.reported_id);
  });
  (blocks || []).forEach((block) => {
    profileIds.add(block.blocker_id);
    profileIds.add(block.blocked_id);
  });

  let profiles = [];
  if (profileIds.size) {
    const { data: profileData, error: profileError } = await serviceClient
      .from('profiles')
      .select('id, display_name, pronouns, is_bot')
      .in('id', [...profileIds]);

    if (profileError) {
      res.status(500).json({ error: profileError.message });
      return;
    }

    profiles = profileData || [];
  }

  res.status(200).json({
    reports: reports || [],
    blocks: blocks || [],
    profiles,
    generated_at: new Date().toISOString()
  });
}
