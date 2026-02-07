import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

const EMPTY_DATA = { reports: [], blocks: [], profiles: [], generated_at: null };

const buildProfileMap = (profiles) => {
  const map = new Map();
  profiles.forEach((profile) => {
    map.set(profile.id, profile);
  });
  return map;
};

export default function ModerationPage() {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [data, setData] = useState(EMPTY_DATA);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus('error');
      setError('Supabase is not configured.');
      return;
    }

    let subscription;
    supabase.auth.getSession().then(({ data: sessionData }) => {
      setSession(sessionData?.session ?? null);
      setStatus('idle');
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStatus('idle');
    });

    subscription = authListener?.subscription;
    return () => subscription?.unsubscribe();
  }, []);

  const profileMap = useMemo(() => buildProfileMap(data.profiles || []), [data.profiles]);

  const resolveProfile = (id) => profileMap.get(id);

  const fetchModeration = async () => {
    if (!session?.access_token) return;
    setStatus('loading');
    setError('');

    try {
      const response = await fetch('/api/admin/moderation', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error || 'Failed to load moderation data.');
        setStatus('error');
        return;
      }

      setData(payload || EMPTY_DATA);
      setStatus('ready');
    } catch (err) {
      setError('Failed to load moderation data.');
      setStatus('error');
    }
  };

  useEffect(() => {
    if (!session) return;
    fetchModeration();
  }, [session]);

  const handleSignIn = async () => {
    const email = window.prompt('Admin email');
    const password = window.prompt('Password');
    if (!email || !password) return;
    await supabase.auth.signInWithPassword({ email, password });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="page admin-page">
      <Head>
        <title>DBN Moderation</title>
      </Head>

      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">DBN</span>
          <div>
            <p className="brand__name">Moderation Console</p>
            <span className="brand__sub">Safety + trust control panel</span>
          </div>
        </div>
        <div className="topbar__actions">
          <button className="btn ghost" onClick={fetchModeration}>
            Refresh
          </button>
          {session ? (
            <button className="btn outline" onClick={handleSignOut}>
              Sign out
            </button>
          ) : (
            <button className="btn outline" onClick={handleSignIn}>
              Admin sign in
            </button>
          )}
        </div>
      </header>

      {!session && (
        <div className="panel admin-card">
          <h3>Sign in required</h3>
          <p className="muted">Use an admin email listed in `ADMIN_EMAILS`.</p>
        </div>
      )}

      {status === 'loading' && (
        <div className="panel admin-card">
          <p className="muted">Loading moderation data…</p>
        </div>
      )}

      {status === 'error' && (
        <div className="panel admin-card">
          <p className="status status--error">{error}</p>
          <p className="muted">Check `ADMIN_EMAILS` and Supabase env vars.</p>
        </div>
      )}

      {status === 'ready' && (
        <div className="admin-grid">
          <section className="panel">
            <div className="panel__header">
              <h3>Reports</h3>
              <span className="chip">{data.reports.length}</span>
            </div>
            <div className="table">
              <div className="table__row table__row--head">
                <span>When</span>
                <span>Reporter</span>
                <span>Reported</span>
                <span>Reason</span>
                <span>Notes</span>
              </div>
              {data.reports.map((report) => {
                const reporter = resolveProfile(report.reporter_id);
                const reported = resolveProfile(report.reported_id);
                return (
                  <div className="table__row" key={report.id}>
                    <span>{new Date(report.created_at).toLocaleString()}</span>
                    <span>{reporter?.display_name || report.reporter_id}</span>
                    <span>{reported?.display_name || report.reported_id}</span>
                    <span className="tag">{report.reason}</span>
                    <span className="muted">{report.notes || '-'}</span>
                  </div>
                );
              })}
              {!data.reports.length && <p className="muted">No reports yet.</p>}
            </div>
          </section>

          <section className="panel">
            <div className="panel__header">
              <h3>Blocks</h3>
              <span className="chip">{data.blocks.length}</span>
            </div>
            <div className="table">
              <div className="table__row table__row--head">
                <span>When</span>
                <span>Blocker</span>
                <span>Blocked</span>
                <span>Type</span>
              </div>
              {data.blocks.map((block) => {
                const blocker = resolveProfile(block.blocker_id);
                const blocked = resolveProfile(block.blocked_id);
                return (
                  <div className="table__row" key={block.id}>
                    <span>{new Date(block.created_at).toLocaleString()}</span>
                    <span>{blocker?.display_name || block.blocker_id}</span>
                    <span>{blocked?.display_name || block.blocked_id}</span>
                    <span className="tag">{blocked?.is_bot ? 'Bot' : 'Human'}</span>
                  </div>
                );
              })}
              {!data.blocks.length && <p className="muted">No blocks yet.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
