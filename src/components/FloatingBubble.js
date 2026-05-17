import React, { useState, useRef } from 'react';
import { sendMessage, hasApiKey } from '../services/gemini';

const INIT_MSGS = [{ role: 'ai', text: 'Anh cần gì không? Em ở đây rồi~ ♡' }];

export default function FloatingBubble() {
  const [pos, setPos]       = useState({ x: window.innerWidth - 72, y: window.innerHeight * 0.65 });
  const [open, setOpen]     = useState(false);
  const [msgs, setMsgs]     = useState(INIT_MSGS);
  const [input, setInput]   = useState('');
  const [busy, setBusy]     = useState(false);
  const drag = useRef({ on: false, sx: 0, sy: 0, bx: 0, by: 0, moved: false });
  const endRef = useRef(null);

  const onTouchStart = (e) => {
    const t = e.touches[0];
    drag.current = { on: true, sx: t.clientX, sy: t.clientY, bx: pos.x, by: pos.y, moved: false };
  };

  const onTouchMove = (e) => {
    const d = drag.current;
    if (!d.on) return;
    const t = e.touches[0];
    const dx = t.clientX - d.sx;
    const dy = t.clientY - d.sy;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) d.moved = true;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 58, d.bx + dx)),
      y: Math.max(64, Math.min(window.innerHeight - 130, d.by + dy)),
    });
    e.preventDefault();
  };

  const onTouchEnd = () => {
    const d = drag.current;
    d.on = false;
    if (!d.moved) {
      setOpen(o => !o);
    } else {
      // Snap to nearest horizontal edge
      setPos(p => ({
        x: (p.x + 29) < window.innerWidth / 2 ? 8 : window.innerWidth - 66,
        y: p.y,
      }));
    }
  };

  // Desktop click support
  const onClick = (e) => {
    if (!drag.current.moved) setOpen(o => !o);
  };

  const sendMsg = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setMsgs(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setBusy(true);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    try {
      const reply = await sendMessage(text);
      setMsgs(prev => [...prev, { role: 'ai', text: reply }]);
    } catch {
      setMsgs(prev => [...prev, { role: 'ai', text: '❌ Lỗi kết nối AI.' }]);
    } finally {
      setBusy(false);
    }
  };

  if (!hasApiKey()) return null;

  const panelAbove = pos.y > window.innerHeight / 2;
  const panelLeft  = Math.min(pos.x, window.innerWidth - 288);

  return (
    <>
      <div
        className="fb-btn"
        style={{ left: pos.x, top: pos.y }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={onClick}
      >
        <span className="fb-icon">{open ? '✕' : '🌸'}</span>
        {!open && <div className="fb-ping" />}
      </div>

      {open && (
        <div
          className="fb-panel"
          style={panelAbove
            ? { bottom: window.innerHeight - pos.y + 10, left: panelLeft }
            : { top: pos.y + 68, left: panelLeft }
          }
        >
          <div className="fb-header">
            <span>🌸 Mei ♡</span>
            <button className="fb-close" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="fb-msgs">
            {msgs.slice(-8).map((m, i) => (
              <div key={i} className={`fb-msg ${m.role}`}>{m.text}</div>
            ))}
            {busy && (
              <div className="fb-msg ai">
                <span className="fb-dots"><span/><span/><span/></span>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="fb-row">
            <input
              className="fb-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMsg()}
              placeholder="Hỏi nhanh..."
              autoFocus
            />
            <button className="fb-send" onClick={sendMsg} disabled={!input.trim() || busy}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}
