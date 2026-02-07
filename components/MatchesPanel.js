export default function MatchesPanel({
  matches,
  selectedMatchId,
  onSelectMatch,
  currentSpark,
  sparkAuthor,
  sparkInput,
  onSparkInputChange,
  onNextSpark,
  onFindResponders,
  sparkResults,
  sparkError,
  onStartChat,
  responderFilter,
  onFilterChange,
  selectedPartner,
  onReport,
  onBlock,
  messages,
  profileId,
  chatInput,
  onChatInputChange,
  onSendMessage,
  currentFlowStage,
  currentFlowStageIndex,
  flowTotal,
  onSuggestedReply
}) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h3>Matches</h3>
        <span className="muted">Consent builds chemistry</span>
      </div>
      <div className="match-list">
        {matches.map((match) => (
          <button
            key={match.id}
            className={`match-list__item ${selectedMatchId === match.id ? 'is-active' : ''}`}
            onClick={() => onSelectMatch(match.id)}
          >
            <span className="match-list__avatar" style={{ backgroundImage: `url(${match.other?.avatar_url})` }} />
            <div>
              <p className="match-list__name">{match.other?.display_name || 'Unknown'}</p>
              <p className="muted">{match.other?.is_bot ? 'Bot match' : 'Human match'}</p>
            </div>
          </button>
        ))}
        {!matches.length && <p className="muted">No matches yet. Flirt to start.</p>}
      </div>

      <div className="panel__header panel__header--tight">
        <h3>Chat</h3>
        <span className="muted">Keep it kind, keep it curious</span>
      </div>

      <div className="spark-panel">
        <div className="spark-card">
          <div className="spark-card__message">
            <div
              className="spark-avatar"
              style={{ backgroundImage: `url(${sparkAuthor?.avatar_url || '/bots/bot-1.jpg'})` }}
            />
            <div>
              <p className="eyebrow">Incoming spark</p>
              <p className="spark-text">"{currentSpark.text}"</p>
              {currentSpark.from && <p className="muted">From {currentSpark.from}</p>}
            </div>
          </div>
          <button className="btn ghost" onClick={onNextSpark}>
            New spark
          </button>
        </div>

        <div className="spark-filter">
          <span className="muted">Responder mix</span>
          <div className="segmented">
            <button
              className={`segmented__btn ${responderFilter === 'mixed' ? 'is-active' : ''}`}
              onClick={() => onFilterChange('mixed')}
            >
              Mixed (mostly humans)
            </button>
            <button
              className={`segmented__btn ${responderFilter === 'humans' ? 'is-active' : ''}`}
              onClick={() => onFilterChange('humans')}
            >
              Humans
            </button>
            <button
              className={`segmented__btn ${responderFilter === 'bots' ? 'is-active' : ''}`}
              onClick={() => onFilterChange('bots')}
            >
              Bots
            </button>
          </div>
          <p className="muted spark-note">
            Mixed keeps bots around 5% when humans exist, and 100% if no humans are online.
          </p>
        </div>

        <div className="spark-input">
          <input
            type="text"
            placeholder="Reply to the spark line to find your best responders"
            value={sparkInput}
            onChange={(event) => onSparkInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onFindResponders();
            }}
          />
          <button className="btn outline" onClick={onFindResponders}>
            Find responders
          </button>
        </div>
        {sparkError && <p className="status status--error">{sparkError}</p>}
        {sparkResults.length > 0 && (
          <div className="spark-results">
            {sparkResults.map((responder, index) => (
              <div className="spark-result" key={responder.id}>
                <div className="spark-result__meta">
                  <span className="spark-rank">#{index + 1}</span>
                  <div>
                    <p className="spark-name">{responder.display_name}</p>
                    <p className="muted">
                      {responder.is_bot ? 'Bot' : 'Human'} · {Math.round(responder.score * 100)}% match
                    </p>
                  </div>
                </div>
                <button className="btn primary" onClick={() => onStartChat(responder)}>
                  Start chat
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPartner && (
        <div className="safety-row">
          <span className="muted">Safety controls</span>
          <div className="safety-actions">
            <button className="btn ghost" onClick={() => onReport(selectedPartner)}>
              Report
            </button>
            <button className="btn outline" onClick={() => onBlock(selectedPartner)}>
              Block
            </button>
          </div>
        </div>
      )}

      <div className="chat-window">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-bubble ${message.sender_id === profileId ? 'is-self' : 'is-other'}`}
          >
            <p>{message.body}</p>
          </div>
        ))}
        {!messages.length && <p className="muted">Start the conversation.</p>}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Say something flirty, respectful, or curious"
          value={chatInput}
          onChange={(event) => onChatInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSendMessage();
          }}
        />
        <button className="btn primary" onClick={onSendMessage}>
          Send
        </button>
      </div>

      {selectedMatchId && currentFlowStage && (
        <div className="flow-panel">
          <div className="flow-panel__header">
            <h4>Guided replies</h4>
            <span className="chip">
              Stage {currentFlowStageIndex + 1}/{flowTotal}
            </span>
          </div>
          <p className="muted">Choices narrow each round until you converge.</p>
          <div className="flow-options">
            {currentFlowStage.options.map((option) => (
              <button key={option} className="btn ghost" onClick={() => onSuggestedReply(option)}>
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
