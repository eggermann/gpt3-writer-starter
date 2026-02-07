import { useEffect, useState } from 'react';

const formatRemaining = (ms) => {
  const safe = Math.max(ms, 0);
  const totalSeconds = Math.floor(safe / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export default function DateRoom({ room, startedAt, durationMs }) {
  const [remaining, setRemaining] = useState(() => {
    if (!startedAt) return durationMs;
    return durationMs - (Date.now() - new Date(startedAt).getTime());
  });

  useEffect(() => {
    if (!startedAt) return undefined;
    const timer = setInterval(() => {
      setRemaining(durationMs - (Date.now() - new Date(startedAt).getTime()));
    }, 1000);
    return () => clearInterval(timer);
  }, [startedAt, durationMs]);

  const expired = remaining <= 0;

  return (
    <div className="date-room">
      <div className="date-room__header">
        <div>
          <p className="eyebrow">Jitsi test room</p>
          <h4>{expired ? 'Time is up' : '5-minute chemistry check'}</h4>
        </div>
        <div className="timer-chip">{formatRemaining(remaining)}</div>
      </div>
      {expired ? (
        <div className="date-room__ended">
          <p>Test date finished. If the vibe is good, schedule a longer one.</p>
        </div>
      ) : (
        <iframe
          className="date-room__frame"
          src={`https://meet.jit.si/${room}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`}
          allow="camera; microphone; fullscreen; speaker"
          title="Date test room"
        />
      )}
    </div>
  );
}
