import DateRoom from './DateRoom';

export default function DatePanel({
  selectedMatch,
  selectedPartner,
  selectedStatus,
  onToggleReady,
  onStartDate,
  isDateActive,
  durationMs
}) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h3>5-minute date test</h3>
        <span className="muted">Both sides opt in</span>
      </div>

      {selectedMatch ? (
        <div className="date-panel">
          <div className="date-panel__card">
            <div className="date-panel__header">
              <div>
                <h4>{selectedPartner?.display_name}</h4>
                <p className="muted">{selectedPartner?.is_bot ? 'Bot' : 'Human'} match</p>
              </div>
              <span className="chip">
                {selectedStatus?.otherReady ? 'They are ready' : 'Waiting on them'}
              </span>
            </div>
            <p>
              When you both tap ready, a 5-minute Jitsi room opens. If the vibe is good,
              schedule longer.
            </p>
            <div className="date-panel__actions">
              <button className="btn outline" onClick={onToggleReady}>
                {selectedStatus?.selfReady ? 'I am ready ✅' : 'I am ready'}
              </button>
              <button
                className="btn primary"
                onClick={onStartDate}
                disabled={!(selectedStatus?.selfReady && selectedStatus?.otherReady)}
              >
                Start 5-minute date
              </button>
            </div>
          </div>

          {selectedMatch.date_room && isDateActive(selectedMatch.date_started_at, durationMs) && (
            <DateRoom room={selectedMatch.date_room} startedAt={selectedMatch.date_started_at} durationMs={durationMs} />
          )}
        </div>
      ) : (
        <p className="muted">Pick a match to unlock a date.</p>
      )}

      <div className="panel__footer">
        <p className="muted">
          Consent is continuous. Either person can pause, reschedule, or end the date at
          any time.
        </p>
      </div>
    </section>
  );
}
