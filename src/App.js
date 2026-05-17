import React, { useState, useEffect } from 'react';
import ChatPage from './pages/ChatPage';
import ReminderPage from './pages/ReminderPage';
import StudyPage from './pages/StudyPage';
import GamePage from './pages/GamePage';
import SummarizePage from './pages/SummarizePage';
import FloatingBubble from './components/FloatingBubble';
import NativeFloatingBubble from './plugins/NativeFloatingBubble';
import WakeWord from './plugins/WakeWord';
import AppWatcher from './plugins/AppWatcher';
import { syncNotifications, syncAppContext, PROVIDERS, getProviderConfig, setAiProvider, setAiModel, setAiKey } from './services/gemini';
import './App.css';

const TABS = [
  { id: 'chat',      icon: '💬', label: 'Chat' },
  { id: 'reminder',  icon: '📅', label: 'Nhắc' },
  { id: 'study',     icon: '📚', label: 'Học' },
  { id: 'game',      icon: '🎮', label: 'Game' },
  { id: 'creative',  icon: '🎨', label: 'Sáng tạo' },
];

const BG_PRESETS = [
  { id: 'none',     label: '✗ Mặc định',   css: '' },
  { id: 'galaxy',   label: '🌌 Galaxy',    css: 'linear-gradient(135deg,#1a0533 0%,#2d1b69 50%,#1e3a5f 100%)' },
  { id: 'ocean',    label: '🌊 Đại dương', css: 'linear-gradient(135deg,#0d1117 0%,#0f2027 50%,#203a43 100%)' },
  { id: 'midnight', label: '🌙 Midnight',  css: 'linear-gradient(135deg,#141e30 0%,#1c3144 50%,#243b55 100%)' },
  { id: 'forest',   label: '🌿 Rừng xanh', css: 'linear-gradient(135deg,#0a1628 0%,#1a3a2a 50%,#0d2818 100%)' },
  { id: 'sakura',   label: '🌸 Sakura',    css: 'linear-gradient(135deg,#2d1f2e 0%,#3d1f3a 50%,#1f1f3d 100%)' },
  { id: 'custom',   label: '🖼 Ảnh URL',   css: 'custom' },
];

function CrossAppBubbleToggle() {
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    NativeFloatingBubble.isRunning().then(r => setRunning(r.running)).catch(() => {});
  }, []);

  const toggle = async () => {
    setLoading(true);
    try {
      if (running) {
        await NativeFloatingBubble.stop();
        setRunning(false);
      } else {
        const res = await NativeFloatingBubble.start();
        if (res.success) setRunning(true);
      }
    } catch (e) {
      if (e.message?.includes('PERMISSION_REQUIRED')) {
        alert('Vui lòng cấp quyền "Hiển thị trên app khác" rồi bật lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-section">
      <div className="settings-row">
        <div>
          <div className="settings-label">🌐 Mei theo anh mọi nơi</div>
          <div className="settings-desc">Bubble nổi trên mọi màn hình ♡</div>
        </div>
        <button
          className={`toggle-switch ${running ? 'on' : ''}`}
          onClick={toggle}
          disabled={loading}
        >
          <span className="toggle-thumb" />
        </button>
      </div>
      {running && (
        <div className="settings-desc" style={{ color: 'var(--green)' }}>
          ● Đang chạy nền — kéo bubble 🤖 để di chuyển
        </div>
      )}
    </div>
  );
}

function WakeWordToggle() {
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    WakeWord.isRunning().then(r => setRunning(r.running)).catch(() => {});
  }, []);

  const toggle = async () => {
    setLoading(true);
    try {
      if (running) {
        await WakeWord.stop();
        setRunning(false);
      } else {
        await WakeWord.start();
        setRunning(true);
      }
    } catch (e) {
      alert('Lỗi khi bật wake word: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-section">
      <div className="settings-row">
        <div>
          <div className="settings-label">🎙️ Wake word "Hey Mei"</div>
          <div className="settings-desc">Nói "Hey Mei" để mở app từ xa</div>
        </div>
        <button
          className={`toggle-switch ${running ? 'on' : ''}`}
          onClick={toggle}
          disabled={loading}
        >
          <span className="toggle-thumb" />
        </button>
      </div>
      {running && (
        <div className="settings-desc" style={{ color: 'var(--green)' }}>
          ● Đang lắng nghe — nói "Hey Mei" để gọi em~
        </div>
      )}
    </div>
  );
}

function AppWatcherToggle() {
  const [running,    setRunning]    = useState(false);
  const [hasPerms,   setHasPerms]   = useState(false);
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    AppWatcher.hasPermission().then(r => setHasPerms(r.granted)).catch(() => {});
    AppWatcher.isRunning().then(r => setRunning(r.running)).catch(() => {});
  }, []);

  const toggle = async () => {
    if (!hasPerms) {
      await AppWatcher.requestPermission();
      // Re-check after user returns from Settings
      setTimeout(async () => {
        const r = await AppWatcher.hasPermission().catch(() => ({ granted: false }));
        setHasPerms(r.granted);
      }, 2000);
      return;
    }
    setLoading(true);
    try {
      if (running) {
        await AppWatcher.stop();
        setRunning(false);
      } else {
        await AppWatcher.start();
        setRunning(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-section">
      <div className="settings-row">
        <div>
          <div className="settings-label">👁️ Mei nhìn ra ngoài cửa sổ</div>
          <div className="settings-desc">
            {hasPerms ? 'Mei biết anh đang dùng app gì ♡' : 'Cần cấp quyền Usage Access'}
          </div>
        </div>
        <button
          className={`toggle-switch ${running ? 'on' : ''}`}
          onClick={toggle}
          disabled={loading}
        >
          <span className="toggle-thumb" />
        </button>
      </div>
      {running && (
        <div className="settings-desc" style={{ color: 'var(--green)' }}>
          ● Đang theo dõi — Mei thấy hết những gì anh làm~
        </div>
      )}
      {!hasPerms && (
        <div className="settings-desc" style={{ color: 'var(--accent)' }}>
          Nhấn toggle để mở trang cấp quyền Usage Access
        </div>
      )}
    </div>
  );
}

// ── API Provider Settings ─────────────────────────────────
function ApiProviderSettings() {
  const cfg = getProviderConfig();
  const [provider, setProvider] = useState(cfg.provider);
  const [model,    setModel]    = useState(cfg.model || PROVIDERS[cfg.provider]?.defaultModel);
  const [keys,     setKeys]     = useState(() => {
    const k = {};
    Object.keys(PROVIDERS).forEach(p => { k[p] = localStorage.getItem(`${p}_api_key`) || ''; });
    return k;
  });
  const [showKey,  setShowKey]  = useState({});

  const handleProviderChange = (p) => {
    setProvider(p);
    setModel(PROVIDERS[p].defaultModel);
    setAiProvider(p);
    setAiModel(PROVIDERS[p].defaultModel);
  };

  const handleModelChange = (m) => {
    setModel(m);
    setAiModel(m);
  };

  const handleKeyChange = (p, val) => {
    setKeys(prev => ({ ...prev, [p]: val }));
    setAiKey(p, val.trim());
  };

  const pInfo = PROVIDERS[provider];

  return (
    <div className="settings-section">
      <div className="settings-label">🤖 AI Provider</div>

      {/* Provider chips */}
      <div className="provider-chips">
        {Object.entries(PROVIDERS).map(([id, info]) => (
          <button
            key={id}
            className={`provider-chip ${provider === id ? 'active' : ''}`}
            onClick={() => handleProviderChange(id)}
          >
            <span className="provider-icon">{info.icon}</span>
            <span>{info.name}</span>
          </button>
        ))}
      </div>

      {/* Model selector */}
      <div className="settings-label" style={{ marginTop: 10, fontSize: 12 }}>Model</div>
      <select
        className="model-select"
        value={model}
        onChange={e => handleModelChange(e.target.value)}
      >
        {pInfo.models.map(m => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>

      {/* API Key input */}
      <div className="api-key-row">
        <div className="settings-label" style={{ fontSize: 12, marginBottom: 4 }}>
          {pInfo.keyLabel}
          <a
            href={pInfo.freeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="api-key-link"
          > ↗ {pInfo.freeNote}</a>
        </div>
        <div className="api-key-input-wrap">
          <input
            className="api-key-input"
            type={showKey[provider] ? 'text' : 'password'}
            placeholder={pInfo.keyPlaceholder}
            value={keys[provider]}
            onChange={e => handleKeyChange(provider, e.target.value)}
          />
          <button
            className="api-key-eye"
            onClick={() => setShowKey(s => ({ ...s, [provider]: !s[provider] }))}
          >
            {showKey[provider] ? '🙈' : '👁️'}
          </button>
        </div>
        {keys[provider] && (
          <div className="settings-desc" style={{ color: 'var(--green)', marginTop: 4 }}>
            ✓ Key đã lưu
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsSheet({ onClose, darkMode, setDarkMode, showBubble, setShowBubble }) {
  const [bgPreset, setBgPreset]     = useState(() => localStorage.getItem('bg_preset') || 'none');
  const [bgUrl,    setBgUrl]        = useState(() => localStorage.getItem('bg_url')    || '');

  const applyBg = (id, url = bgUrl) => {
    setBgPreset(id);
    localStorage.setItem('bg_preset', id);
    const preset = BG_PRESETS.find(p => p.id === id);
    if (!preset) return;
    if (id === 'none') {
      document.documentElement.style.removeProperty('--app-bg');
      document.documentElement.classList.remove('has-bg', 'is-img-bg');
    } else if (id === 'custom' && url) {
      document.documentElement.style.setProperty('--app-bg', `url(${url})`);
      document.documentElement.classList.add('has-bg', 'is-img-bg');
      document.documentElement.classList.remove('is-gradient-bg');
    } else if (preset.css) {
      document.documentElement.style.setProperty('--app-bg', preset.css);
      document.documentElement.classList.add('has-bg', 'is-gradient-bg');
      document.documentElement.classList.remove('is-img-bg');
    }
  };

  const applyUrl = (url) => {
    setBgUrl(url);
    localStorage.setItem('bg_url', url);
    if (bgPreset === 'custom') applyBg('custom', url);
  };

  // Restore on mount
  useEffect(() => {
    applyBg(bgPreset, bgUrl);
  }, []);

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-sheet" onClick={e => e.stopPropagation()}>
        <div className="settings-handle" />
        <h3 className="settings-title">⚙️ Cài đặt</h3>

        {/* AI Provider */}
        <ApiProviderSettings />

        {/* Background */}
        <div className="settings-section">
          <div className="settings-label">🖼 Hình nền</div>
          <div className="bg-grid">
            {BG_PRESETS.map(p => (
              <button
                key={p.id}
                className={`bg-chip ${bgPreset === p.id ? 'active' : ''}`}
                style={p.css && p.css !== 'custom' ? { background: p.css } : {}}
                onClick={() => applyBg(p.id)}
              >
                <span className="bg-chip-label">{p.label}</span>
              </button>
            ))}
          </div>
          {bgPreset === 'custom' && (
            <input
              className="input-field"
              type="url"
              placeholder="https://... (URL ảnh)"
              value={bgUrl}
              onChange={e => applyUrl(e.target.value)}
            />
          )}
        </div>

        {/* In-app bubble */}
        <div className="settings-section">
          <div className="settings-row">
            <div>
              <div className="settings-label">🫧 Bubble trong app</div>
              <div className="settings-desc">Nút chat nhanh khi dùng app</div>
            </div>
            <button
              className={`toggle-switch ${showBubble ? 'on' : ''}`}
              onClick={() => {
                const v = !showBubble;
                setShowBubble(v);
                localStorage.setItem('show_bubble', String(v));
              }}
            >
              <span className="toggle-thumb" />
            </button>
          </div>
        </div>

        {/* Cross-app bubble (native Android) */}
        <CrossAppBubbleToggle />

        {/* Wake word */}
        <WakeWordToggle />

        {/* App watcher */}
        <AppWatcherToggle />

        {/* Theme */}
        <div className="settings-section">
          <div className="settings-row">
            <div className="settings-label">🌓 Giao diện</div>
            <button
              className={`toggle-switch ${!darkMode ? 'on' : ''}`}
              onClick={() => setDarkMode(d => !d)}
            >
              <span className="toggle-thumb" />
            </button>
          </div>
          <div className="settings-desc">{darkMode ? '🌙 Đang dùng tối' : '☀️ Đang dùng sáng'}</div>
        </div>

        <button className="btn-primary" onClick={onClose}>✓ Xong</button>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab,   setActiveTab]   = useState('chat');
  const [darkMode,    setDarkMode]    = useState(() => localStorage.getItem('theme') !== 'light');
  const [showBubble,  setShowBubble]  = useState(() => localStorage.getItem('show_bubble') !== 'false');
  const [showSettings,setShowSettings]= useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Sync notifications + app context on mount (Monika context)
  useEffect(() => {
    syncNotifications();
    syncAppContext();
    // Refresh app context every 30s so Gemini always has fresh data
    const interval = setInterval(syncAppContext, 30000);
    return () => clearInterval(interval);
  }, []);

  // Restore background on first load
  useEffect(() => {
    const preset = localStorage.getItem('bg_preset') || 'none';
    const url    = localStorage.getItem('bg_url')    || '';
    const p = BG_PRESETS.find(x => x.id === preset);
    if (!p || p.id === 'none') return;
    if (p.id === 'custom' && url) {
      document.documentElement.style.setProperty('--app-bg', `url(${url})`);
      document.documentElement.classList.add('has-bg', 'is-img-bg');
    } else if (p.css) {
      document.documentElement.style.setProperty('--app-bg', p.css);
      document.documentElement.classList.add('has-bg', 'is-gradient-bg');
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <div className="header-avatar">🌸</div>
          <div>
            <div className="header-title">Mei ♡</div>
            <div className="header-status">● Em đang ở đây~</div>
          </div>
        </div>
        <div className="header-actions">
          <button className="icon-header-btn" onClick={() => setDarkMode(d => !d)}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button className="icon-header-btn" onClick={() => setShowSettings(true)}>⚙️</button>
        </div>
      </header>

      <main className="app-main">
        <div style={{ display: activeTab === 'chat'     ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
          <ChatPage />
        </div>
        <div style={{ display: activeTab === 'reminder' ? 'block' : 'none', height: '100%' }}>
          <ReminderPage />
        </div>
        <div style={{ display: activeTab === 'study'    ? 'block' : 'none', height: '100%' }}>
          <StudyPage />
        </div>
        <div style={{ display: activeTab === 'game'     ? 'block' : 'none', height: '100%' }}>
          <GamePage />
        </div>
        <div style={{ display: activeTab === 'creative'  ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
          <SummarizePage />
        </div>
      </main>

      <nav className="bottom-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {showBubble && <FloatingBubble />}

      {showSettings && (
        <SettingsSheet
          onClose={() => setShowSettings(false)}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          showBubble={showBubble}
          setShowBubble={setShowBubble}
        />
      )}
    </div>
  );
}
