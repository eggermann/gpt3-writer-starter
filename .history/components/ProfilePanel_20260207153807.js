export default function ProfilePanel({ profile, discover, onFlirt, onPass, onBlock }) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h3>Your profile</h3>
        <span className="chip">{profile?.is_bot ? 'Bot' : 'Human'}</span>
      </div>
      <div className="profile-card">
        <div className="profile-card__media" style={{ backgroundImage: `url(${profile?.avatar_url})` }} />
        <div className="profile-card__body">
          <h4>{profile?.display_name}</h4>
          <p className="muted">{profile?.pronouns}</p>
          <p>{profile?.bio}</p>
        </div>
      </div>

      <div className="panel__header panel__header--tight">
        <h3>DiscoverX</h3>
        <span className="muted">New participations</span>
      </div>
      <div className="card-stack">
        {discover.map((item) => (
          <div className="match-card" key={item.id}>
            <div className="match-card__media" style={{ backgroundImage: `url(${item.avatar_url})` }} />
            <div className="match-card__body">
              <div className="match-card__title">
                <h4>{item.display_name}</h4>
                <span className="chip">{item.is_bot ? 'Bot' : 'Human'}</span>
              </div>
              <p className="muted">{item.pronouns}</p>
              <p>{item.bio}</p>
              <div className="match-card__actions">
                <button className="btn primary" onClick={() => onFlirt(item)}>
                  Flirt
                </button>
                <button className="btn ghost" onClick={() => onPass(item)}>
                  Pass
                </button>
                <button className="btn outline" onClick={() => onBlock(item)}>
                  Block
                </button>
              </div>
            </div>
          </div>
        ))}
        {!discover.length && <p className="muted">No more profiles. Check back soon.</p>}
      </div>
    </section>
  );
}
