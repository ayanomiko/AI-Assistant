import React, { useState } from 'react';
import { summarizeContent, sendMessage } from '../services/gemini';

const CREATIVE_PROMPTS = [
  { icon: '✍️', label: 'Viết truyện ngắn', prompt: 'Viết cho anh một truyện ngắn thú vị, sáng tạo~ Em có thể chọn thể loại gì em thích ♡' },
  { icon: '💡', label: 'Ý tưởng mới',      prompt: 'Cho anh 5 ý tưởng sáng tạo thú vị có thể làm ngay hôm nay~' },
  { icon: '🎨', label: 'Mô tả ảnh AI',     prompt: 'Viết một prompt tiếng Anh chi tiết để tạo ảnh AI đẹp theo phong cách anime, cảnh lãng mạn~' },
  { icon: '🎵', label: 'Viết lời bài hát', prompt: 'Viết lời bài hát tiếng Việt ngắn, chủ đề tình yêu nhẹ nhàng~' },
  { icon: '📖', label: 'Kịch bản nhập vai', prompt: 'Tạo một kịch bản nhập vai thú vị cho chúng ta, em đóng vai Mei và anh tự chọn vai của anh~' },
  { icon: '🌸', label: 'Thư từ Mei',       prompt: 'Viết một bức thư ngắn từ Mei gửi cho anh, thể hiện cảm xúc của em hôm nay~' },
];

const SUMMARIZE_TYPES = [
  { id: 'text', label: '📄 Văn bản',   placeholder: 'Dán nội dung cần tóm tắt vào đây...' },
  { id: 'url',  label: '🔗 URL',       placeholder: 'https://...' },
];

// ── Summarize Tab ──────────────────────────────────────────
function SummarizeTab() {
  const [type,    setType]    = useState('text');
  const [input,   setInput]   = useState('');
  const [result,  setResult]  = useState('');
  const [busy,    setBusy]    = useState(false);

  const go = async () => {
    if (!input.trim() || busy) return;
    setBusy(true);
    setResult('');
    try {
      const r = await summarizeContent(input.trim(), type);
      setResult(r);
    } catch (err) {
      setResult('❌ Lỗi: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sum-tab">
      {/* Type selector */}
      <div className="sum-type-row">
        {SUMMARIZE_TYPES.map(t => (
          <button
            key={t.id}
            className={`sum-type-btn ${type === t.id ? 'active' : ''}`}
            onClick={() => { setType(t.id); setInput(''); setResult(''); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <textarea
        className="sum-input"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={SUMMARIZE_TYPES.find(t => t.id === type)?.placeholder}
        rows={6}
      />

      <button className="btn-primary" onClick={go} disabled={!input.trim() || busy}>
        {busy ? '⏳ Đang tóm tắt...' : '✨ Tóm tắt ngay'}
      </button>

      {result && (
        <div className="sum-result">
          <div className="sum-result-header">
            <span>🌸 Mei tóm tắt</span>
            <button
              className="icon-btn"
              onClick={() => navigator.clipboard?.writeText(result)}
              title="Copy"
            >📋</button>
          </div>
          <div className="sum-result-body">
            {result.split('\n').map((line, i, arr) => (
              <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Creative Tab ───────────────────────────────────────────
function CreativeTab() {
  const [result,  setResult]  = useState('');
  const [busy,    setBusy]    = useState(false);
  const [active,  setActive]  = useState(null);
  const [custom,  setCustom]  = useState('');

  const generate = async (prompt, key) => {
    if (busy) return;
    setActive(key);
    setBusy(true);
    setResult('');
    try {
      const r = await sendMessage(prompt);
      setResult(r);
    } catch (err) {
      setResult('❌ Lỗi: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sum-tab">
      <div className="creative-grid">
        {CREATIVE_PROMPTS.map((p, i) => (
          <button
            key={i}
            className={`creative-chip ${active === i ? 'active' : ''}`}
            onClick={() => generate(p.prompt, i)}
            disabled={busy}
          >
            <span className="creative-icon">{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Custom prompt */}
      <div className="creative-custom-row">
        <input
          className="input-field"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && generate(custom, 'custom')}
          placeholder="Hoặc nhập yêu cầu sáng tạo của riêng anh~"
        />
        <button
          className="send-btn"
          onClick={() => generate(custom, 'custom')}
          disabled={!custom.trim() || busy}
        >➤</button>
      </div>

      {busy && (
        <div className="creative-loading">
          <span className="fb-dots"><span/><span/><span/></span>
          <span style={{ marginLeft: 8 }}>Mei đang sáng tạo~</span>
        </div>
      )}

      {result && (
        <div className="sum-result">
          <div className="sum-result-header">
            <span>🌸 Kết quả</span>
            <button
              className="icon-btn"
              onClick={() => navigator.clipboard?.writeText(result)}
              title="Copy"
            >📋</button>
          </div>
          <div className="sum-result-body">
            {result.split('\n').map((line, i, arr) => (
              <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────
export default function SummarizePage() {
  const [tab, setTab] = useState('summarize');

  return (
    <div className="page-wrap">
      <div className="page-tabs">
        <button
          className={`page-tab ${tab === 'summarize' ? 'active' : ''}`}
          onClick={() => setTab('summarize')}
        >
          📝 Tóm tắt
        </button>
        <button
          className={`page-tab ${tab === 'creative' ? 'active' : ''}`}
          onClick={() => setTab('creative')}
        >
          🎨 Sáng tạo
        </button>
      </div>

      {tab === 'summarize' ? <SummarizeTab /> : <CreativeTab />}
    </div>
  );
}
