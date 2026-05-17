import React, { useState, useEffect, useRef } from 'react';

function fmt(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function fmtMins(mins) {
  if (mins >= 60) return `${(mins / 60).toFixed(1)}h`;
  return `${mins}m`;
}

function load(k, fb) {
  try { return JSON.parse(localStorage.getItem(k)) ?? fb; }
  catch { return fb; }
}

function getTodayTotal() {
  const saved = load('game_today', { date: '', total: 0 });
  return saved.date === new Date().toDateString() ? saved.total : 0;
}

export default function GamePage() {
  const [limitMins, setLimitMins]   = useState(() => load('game_limit_mins', 120));
  const [todayTotal, setTodayTotal] = useState(getTodayTotal);
  const [isPlaying,  setIsPlaying]  = useState(false);
  const [sessionSec, setSessionSec] = useState(0);
  const [sessions,   setSessions]   = useState(() => load('game_sessions', []));
  const [limitInput, setLimitInput] = useState(() => String(load('game_limit_mins', 120)));

  const tickRef     = useRef(null);
  const startRef    = useRef(null);
  const warnedRef   = useRef(false);

  const limitSecs  = limitMins * 60;
  const leftSecs   = Math.max(0, limitSecs - todayTotal);
  const usedPct    = Math.min(100, (todayTotal / limitSecs) * 100);
  const circ       = 2 * Math.PI * 54;
  const dashOffset = circ * (1 - usedPct / 100);

  useEffect(() => {
    if (!isPlaying) { clearInterval(tickRef.current); return; }
    startRef.current = Date.now() - sessionSec * 1000;
    tickRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      setSessionSec(elapsed);

      const total = todayTotal + elapsed;

      // 5-minute warning
      if (!warnedRef.current && total >= limitSecs - 300 && total < limitSecs - 295) {
        warnedRef.current = true;
        if (Notification.permission === 'granted') {
          new Notification('⚠️ Sắp hết giờ game!', {
            body: 'Còn 5 phút nữa hết thời gian cho phép hôm nay.',
            icon: '/logo192.png',
          });
        }
      }

      // Limit reached
      if (total >= limitSecs) {
        stopPlaying(elapsed, true);
      }
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [isPlaying]);

  const startPlaying = () => {
    if (leftSecs <= 0) return;
    Notification.requestPermission();
    warnedRef.current = false;
    setSessionSec(0);
    setIsPlaying(true);
  };

  const stopPlaying = (elapsed = sessionSec, auto = false) => {
    clearInterval(tickRef.current);
    setIsPlaying(false);

    if (elapsed > 0) {
      const newTotal = todayTotal + elapsed;
      setTodayTotal(newTotal);
      localStorage.setItem('game_today', JSON.stringify({ date: new Date().toDateString(), total: newTotal }));

      const sess = {
        id: Date.now(),
        duration: elapsed,
        date: new Date().toLocaleDateString('vi-VN'),
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        auto,
      };
      const updated = [sess, ...sessions].slice(0, 30);
      setSessions(updated);
      localStorage.setItem('game_sessions', JSON.stringify(updated));
    }

    setSessionSec(0);
    if (auto && Notification.permission === 'granted') {
      new Notification('🛑 Hết giờ game!', {
        body: 'Bạn đã chơi đủ thời gian hôm nay. Nghỉ ngơi nhé! 😊',
        icon: '/logo192.png',
      });
    }
  };

  const saveLimit = () => {
    const v = parseFloat(limitInput);
    if (isNaN(v) || v <= 0) return;
    const mins = Math.max(10, Math.min(720, Math.round(v)));
    setLimitMins(mins);
    localStorage.setItem('game_limit_mins', String(mins));
    setLimitInput(String(mins));
  };

  const resetDay = () => {
    if (!window.confirm('Reset thống kê hôm nay?')) return;
    setTodayTotal(0);
    localStorage.setItem('game_today', JSON.stringify({ date: new Date().toDateString(), total: 0 }));
  };

  const usageColor = usedPct >= 100 ? '#ef4444' : usedPct >= 80 ? '#f59e0b' : '#10b981';

  return (
    <div className="page-scroll">
      <div className="page-header">
        <h2 className="page-title">🎮 Quản lý Game</h2>
        <button className="btn-outline sm" onClick={resetDay}>↺ Reset</button>
      </div>

      {/* Usage ring */}
      <div className="game-ring-card">
        <div className="ring-wrap">
          <svg viewBox="0 0 120 120" className="ring-svg">
            <circle cx="60" cy="60" r="54" className="ring-track" />
            <circle
              cx="60" cy="60" r="54"
              className="ring-fill"
              style={{ stroke: usageColor }}
              strokeDasharray={circ}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="ring-center">
            <div className="ring-value">{fmt(todayTotal)}</div>
            <div className="ring-label">đã chơi</div>
          </div>
        </div>
        <div className="usage-stats">
          <div className="stat-item">
            <div className="stat-val" style={{ color: leftSecs > 0 ? usageColor : '#ef4444' }}>
              {fmt(leftSecs)}
            </div>
            <div className="stat-lbl">còn lại</div>
          </div>
          <div className="stat-item">
            <div className="stat-val">{fmtMins(limitMins)}</div>
            <div className="stat-lbl">giới hạn</div>
          </div>
          <div className="stat-item">
            <div className="stat-val">{Math.round(usedPct)}%</div>
            <div className="stat-lbl">đã dùng</div>
          </div>
        </div>
      </div>

      {/* Play/Stop button */}
      <div className="play-section">
        {isPlaying ? (
          <div className="playing-card">
            <div className="session-time">{fmt(sessionSec)}</div>
            <div className="playing-label">🎮 Đang chơi...</div>
            <button className="btn-danger" onClick={() => stopPlaying()}>⏹ Dừng lại</button>
          </div>
        ) : (
          <button
            className={`btn-play ${leftSecs <= 0 ? 'disabled' : ''}`}
            onClick={startPlaying}
            disabled={leftSecs <= 0}
          >
            {leftSecs <= 0 ? '😴 Hết giờ hôm nay' : '▶ Bắt đầu chơi'}
          </button>
        )}
        {leftSecs <= 0 && (
          <p className="limit-msg">🌙 Đã đủ {fmtMins(limitMins)} hôm nay. Nghỉ ngơi nhé!</p>
        )}
      </div>

      {/* Limit setting */}
      <div className="section-card">
        <h3 className="section-title">⏱ Giới hạn thời gian / ngày</h3>
        <div className="row gap-8">
          <input
            className="input-field flex-1"
            type="number"
            min="10"
            max="720"
            step="10"
            value={limitInput}
            onChange={e => setLimitInput(e.target.value)}
            placeholder="phút"
          />
          <span className="unit-label">phút</span>
          <button className="btn-outline" onClick={saveLimit}>Lưu</button>
        </div>
        <div className="limit-presets">
          {[30, 60, 90, 120, 180].map(v => (
            <button
              key={v}
              className={`preset-chip ${limitMins === v ? 'active' : ''}`}
              onClick={() => { setLimitInput(String(v)); setLimitMins(v); localStorage.setItem('game_limit_mins', String(v)); }}
            >
              {fmtMins(v)}
            </button>
          ))}
        </div>
      </div>

      {/* History */}
      {sessions.length > 0 && (
        <div className="section-card">
          <h3 className="section-title">📊 Lịch sử chơi</h3>
          {sessions.slice(0, 7).map(s => (
            <div key={s.id} className="session-row">
              <div className="session-info">
                <span className="session-date">{s.date}</span>
                <span className="session-time-label">{s.time}</span>
              </div>
              <div className="session-right">
                <span className="session-dur">{fmt(s.duration)}</span>
                {s.auto && <span className="auto-chip">⏰ Hết giờ</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
