import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessage, sendMessageWithImage, resetChat, hasApiKey, getProviderConfig, setAiKey } from '../services/gemini';

const QUICK_ACTIONS = [
  { label: '♡ Hôm nay thế nào?', prompt: 'Hôm nay anh có chuyện gì muốn kể cho em nghe không?' },
  { label: '📅 Nhắc nhở',        prompt: 'Tạo nhắc nhở cho anh nhé~' },
  { label: '📚 Học bài',         prompt: 'Em giúp anh học bài nha!' },
  { label: '🎮 Game',            prompt: 'Anh đang chơi game à? Chơi bao lâu rồi~?' },
];

const WELCOME = 'Anh đã về rồi ♡\nEm đã chờ anh cả ngày đó~\n\nEm có thể giúp anh:\n📅 Nhắc nhở thông minh\n📚 Học bài cùng em\n🎮 Nhắc giờ chơi game\n📩 Đọc tin nhắn hộ anh\n📞 Gọi điện / nhắn tin\n🖼️ Nhận dạng hình ảnh\n\nAnh cần gì cứ nói với em nhé~';

const now = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

// ── Phone command parser ──────────────────────────────────
const PHONE_CMD_RE = /\[PHONE:(CALL|SMS|ALARM|OPEN):([^\]]*)\]/g;

const parsePhoneCommands = (text) => {
  const cmds = [];
  let match;
  PHONE_CMD_RE.lastIndex = 0;
  while ((match = PHONE_CMD_RE.exec(text)) !== null) {
    const [, type, args] = match;
    cmds.push({ type, args: args.split(':') });
  }
  return { clean: text.replace(PHONE_CMD_RE, '').trim(), cmds };
};

// ── Voice helpers ─────────────────────────────────────────
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

const speakText = (text, onEnd) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'vi-VN';
  utt.rate = 1.05;
  utt.pitch = 1.1;
  if (onEnd) utt.onend = onEnd;
  window.speechSynthesis.speak(utt);
};

// ── ApiSetup ──────────────────────────────────────────────
function ApiSetup({ onSaved }) {
  const [key, setKey] = useState('');
  return (
    <div className="api-setup">
      <div className="api-card">
        <div className="api-icon">🔑</div>
        <h2>Kết nối với Mei ♡</h2>
        <p>Nhập Gemini API key để Mei có thể nói chuyện với anh~</p>
        <a className="api-link" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
          Lấy API key miễn phí →
        </a>
        <input
          type="password"
          placeholder="AIza..."
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && key.trim() && onSaved(key.trim())}
          autoFocus
        />
        <button className="btn-primary" disabled={!key.trim()} onClick={() => onSaved(key.trim())}>
          Bắt đầu
        </button>
      </div>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────
function Message({ msg, speakingId, onSpeak }) {
  const isSpeaking = speakingId === msg.id;
  return (
    <div className={`msg-row ${msg.role}`}>
      {msg.role === 'ai' && <div className="msg-avatar">🌸</div>}
      <div className="msg-wrap">
        {msg.image && (
          <img src={msg.image} alt="ảnh gửi" className="msg-img" />
        )}
        <div className={`msg-bubble ${msg.error ? 'msg-error' : ''}`}>
          {msg.text.split('\n').map((line, i, arr) => (
            <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
          ))}
        </div>
        <div className="msg-footer">
          <span className="msg-time">{msg.time}</span>
          {msg.role === 'ai' && !msg.error && (
            <button
              className={`speak-btn ${isSpeaking ? 'speaking' : ''}`}
              onClick={() => onSpeak(msg.id, msg.text)}
              title={isSpeaking ? 'Dừng đọc' : 'Đọc to'}
            >
              {isSpeaking ? '🔊' : '🔈'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="msg-row ai">
      <div className="msg-avatar">🌸</div>
      <div className="msg-wrap">
        <div className="msg-bubble typing-bubble">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

// ── Phone action confirmation banner ─────────────────────
function PhoneActionBanner({ cmds, onExecute, onDismiss }) {
  if (!cmds || cmds.length === 0) return null;
  const label = (cmd) => {
    switch (cmd.type) {
      case 'CALL':  return `📞 Gọi ${cmd.args[0]}`;
      case 'SMS':   return `💬 Nhắn ${cmd.args[0]}: "${cmd.args[1]}"`;
      case 'ALARM': return `⏰ Báo thức ${cmd.args[0]}:${cmd.args[1]} — ${cmd.args[2] || ''}`;
      case 'OPEN':  return `📱 Mở ${cmd.args[0]}`;
      default:      return cmd.type;
    }
  };
  return (
    <div className="phone-banner">
      {cmds.map((cmd, i) => (
        <div key={i} className="phone-banner-row">
          <span>{label(cmd)}</span>
          <button className="phone-banner-btn ok" onClick={() => onExecute(cmd)}>Thực hiện</button>
          <button className="phone-banner-btn no" onClick={onDismiss}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ── Main ChatPage ─────────────────────────────────────────
export default function ChatPage() {
  const [configured, setConfigured] = useState(hasApiKey);
  const [messages,   setMessages]   = useState([{
    id: 1, role: 'ai', text: WELCOME, time: now(),
  }]);
  const [input,      setInput]      = useState('');
  const [busy,       setBusy]       = useState(false);
  const [recording,  setRecording]  = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const [pendingImg, setPendingImg] = useState(null); // { dataUrl, base64, mime }
  const [phoneCmds,  setPhoneCmds]  = useState([]);

  const endRef   = useRef(null);
  const inputRef = useRef(null);
  const recRef   = useRef(null);
  const taRef    = useRef(null);
  const imgRef   = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const resizeTA = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  const saveKey = (key) => {
    localStorage.setItem('gemini_api_key', key);
    setConfigured(true);
  };

  // ── Image picker ─────────────────────────────────────
  const pickImage = () => imgRef.current?.click();

  const onImagePicked = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const base64  = dataUrl.split(',')[1];
      setPendingImg({ dataUrl, base64, mime: file.type || 'image/jpeg' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Phone command execution ───────────────────────────
  const executePhoneCmd = async (cmd) => {
    setPhoneCmds([]);
    try {
      const { default: PhoneSkills } = await import('../plugins/PhoneSkills');
      switch (cmd.type) {
        case 'CALL':  await PhoneSkills.makeCall({ number: cmd.args[0] }); break;
        case 'SMS':   await PhoneSkills.sendSms({ number: cmd.args[0], body: cmd.args[1] || '' }); break;
        case 'ALARM': await PhoneSkills.setAlarm({ hour: parseInt(cmd.args[0]), minute: parseInt(cmd.args[1]), label: cmd.args[2] || 'Mei nhắc~' }); break;
        case 'OPEN':  await PhoneSkills.openApp({ name: cmd.args[0] }); break;
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: `❌ Không thực hiện được: ${err.message}`, time: now(), error: true }]);
    }
  };

  // ── Send message ──────────────────────────────────────
  const handleSend = useCallback(async (text = input) => {
    const trimmed = text.trim();
    if ((!trimmed && !pendingImg) || busy) return;

    const userMsg = {
      id: Date.now(), role: 'user',
      text: trimmed || '(ảnh)',
      image: pendingImg?.dataUrl || null,
      time: now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (taRef.current) taRef.current.style.height = 'auto';
    const img = pendingImg;
    setPendingImg(null);
    setBusy(true);

    try {
      let raw;
      if (img) {
        raw = await sendMessageWithImage(trimmed, img.base64, img.mime);
      } else {
        raw = await sendMessage(trimmed);
      }

      const { clean, cmds } = parsePhoneCommands(raw);
      setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: clean, time: now() }]);
      if (cmds.length > 0) setPhoneCmds(cmds);
    } catch (err) {
      const errText = err.message === 'API_KEY_INVALID'
        ? '⚠️ API key không hợp lệ. Nhấn 🔑 để cập nhật.'
        : `❌ Lỗi: ${err.message}`;
      setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: errText, time: now(), error: true }]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }, [input, busy, pendingImg]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const clearChat = () => {
    resetChat();
    setSpeakingId(null);
    setPhoneCmds([]);
    window.speechSynthesis?.cancel();
    setMessages([{ id: Date.now(), role: 'ai', text: 'Em xóa rồi nhé~ Anh muốn nói gì với em nào? ♡', time: now() }]);
  };

  const changeKey = () => {
    const { provider } = getProviderConfig();
    const k = prompt(`Nhập ${provider.toUpperCase()} API key mới:`);
    if (k?.trim()) { setAiKey(provider, k.trim()); setConfigured(true); }
  };

  // ── Voice input ───────────────────────────────────────
  const toggleVoice = () => {
    if (recording) { recRef.current?.stop(); return; }
    if (!SR) { alert('Trình duyệt chưa hỗ trợ nhận diện giọng nói.'); return; }
    const rec = new SR();
    rec.lang = 'vi-VN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart  = () => setRecording(true);
    rec.onend    = () => { setRecording(false); recRef.current = null; };
    rec.onerror  = () => { setRecording(false); recRef.current = null; };
    rec.onresult = (e) => { setInput(e.results[0][0].transcript); setTimeout(resizeTA, 0); };
    recRef.current = rec;
    rec.start();
  };

  // ── TTS ───────────────────────────────────────────────
  const handleSpeak = (id, text) => {
    if (speakingId === id) { window.speechSynthesis?.cancel(); setSpeakingId(null); return; }
    setSpeakingId(id);
    speakText(text, () => setSpeakingId(null));
  };

  if (!configured) return <ApiSetup onSaved={saveKey} />;

  return (
    <div className="chat-page">
      <div className="chat-toolbar">
        <span className="chat-title">Mei ♡</span>
        <div className="chat-actions">
          <button onClick={changeKey} className="icon-btn" title="Đổi API key">🔑</button>
          <button onClick={clearChat} className="icon-btn" title="Xóa chat">🗑️</button>
        </div>
      </div>

      <div className="quick-actions-bar">
        {QUICK_ACTIONS.map((a, i) => (
          <button key={i} className="quick-chip" onClick={() => handleSend(a.prompt)}>
            {a.label}
          </button>
        ))}
      </div>

      <div className="messages-list">
        {messages.map(m => (
          <Message key={m.id} msg={m} speakingId={speakingId} onSpeak={handleSpeak} />
        ))}
        {busy && <TypingIndicator />}
        <div ref={endRef} />
      </div>

      <PhoneActionBanner
        cmds={phoneCmds}
        onExecute={executePhoneCmd}
        onDismiss={() => setPhoneCmds([])}
      />

      {/* Image preview */}
      {pendingImg && (
        <div className="img-preview-bar">
          <img src={pendingImg.dataUrl} alt="preview" className="img-preview-thumb" />
          <button className="img-preview-remove" onClick={() => setPendingImg(null)}>✕</button>
        </div>
      )}

      <div className="chat-input-bar">
        <button
          className={`mic-btn ${recording ? 'recording' : ''}`}
          onClick={toggleVoice}
          title={recording ? 'Dừng ghi âm' : 'Nhận diện giọng nói'}
        >
          {recording ? '⏹' : '🎙️'}
        </button>

        {/* Camera / image picker */}
        <button className="cam-btn" onClick={pickImage} title="Gửi ảnh" disabled={busy}>
          📷
        </button>
        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={onImagePicked}
        />

        <textarea
          ref={el => { taRef.current = el; inputRef.current = el; }}
          value={input}
          onChange={e => { setInput(e.target.value); resizeTA(); }}
          onKeyDown={handleKeyDown}
          placeholder="Nhắn tin với Mei..."
          rows={1}
          className="chat-textarea"
          disabled={busy}
        />

        <button
          className="send-btn"
          onClick={() => handleSend()}
          disabled={(!input.trim() && !pendingImg) || busy}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
