import React, { useState, useEffect } from 'react';

const CATEGORIES = [
  { id: 'general', icon: '📌', label: 'Chung' },
  { id: 'study',   icon: '📚', label: 'Học' },
  { id: 'game',    icon: '🎮', label: 'Game' },
  { id: 'health',  icon: '💊', label: 'Sức khỏe' },
  { id: 'work',    icon: '💼', label: 'Việc' },
];

const EMPTY_FORM = { title: '', date: '', time: '', category: 'general', repeat: 'once' };

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

export default function ReminderPage() {
  const [reminders, setReminders] = useState(() => load('reminders', []));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [notifGranted, setNotifGranted] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );

  useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Fires browser notification when a reminder is due
  useEffect(() => {
    const tick = setInterval(() => {
      if (!notifGranted) return;
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const today = now.toLocaleDateString('vi-VN');

      reminders.forEach(r => {
        if (r.done || r.fired) return;
        const dateMatch = !r.date || r.date === today || r.repeat !== 'once';
        if (dateMatch && r.time === hhmm) {
          new Notification(`🔔 ${r.title}`, { body: `Nhắc nhở lúc ${r.time}`, icon: '/logo192.png' });
          // Mark fired for once-type reminders
          if (r.repeat === 'once') {
            setReminders(prev => prev.map(x => x.id === r.id ? { ...x, fired: true } : x));
          }
        }
      });
    }, 20000);
    return () => clearInterval(tick);
  }, [reminders, notifGranted]);

  const requestNotif = async () => {
    const perm = await Notification.requestPermission();
    setNotifGranted(perm === 'granted');
  };

  const addReminder = () => {
    if (!form.title.trim() || !form.time) return;
    const r = {
      id: Date.now(),
      ...form,
      title: form.title.trim(),
      done: false,
      fired: false,
    };
    setReminders(prev => [r, ...prev]);
    setForm(EMPTY_FORM);
    setShowForm(false);
    if (!notifGranted) requestNotif();
  };

  const toggle = (id) => setReminders(prev => prev.map(r => r.id === id ? { ...r, done: !r.done, fired: r.done ? false : r.fired } : r));
  const remove  = (id) => setReminders(prev => prev.filter(r => r.id !== id));

  const catOf = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];
  const pending = reminders.filter(r => !r.done);
  const done    = reminders.filter(r => r.done);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="page-scroll">
      <div className="page-header">
        <h2 className="page-title">📅 Nhắc nhở</h2>
        <button className="btn-outline" onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Đóng' : '+ Thêm'}
        </button>
      </div>

      {!notifGranted && (
        <div className="notif-banner" onClick={requestNotif}>
          🔔 Bật thông báo để nhận nhắc nhở đúng giờ →
        </div>
      )}

      {showForm && (
        <div className="form-card">
          <input
            className="input-field"
            type="text"
            placeholder="Tiêu đề nhắc nhở..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            autoFocus
          />
          <div className="row gap-8">
            <input
              className="input-field flex-1"
              type="date"
              min={today}
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
            <input
              className="input-field flex-1"
              type="time"
              value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
            />
          </div>
          <div className="chip-group">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`cat-chip ${form.category === cat.id ? 'active' : ''}`}
                onClick={() => setForm(f => ({ ...f, category: cat.id }))}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
          <select
            className="input-field"
            value={form.repeat}
            onChange={e => setForm(f => ({ ...f, repeat: e.target.value }))}
          >
            <option value="once">Một lần</option>
            <option value="daily">Hàng ngày</option>
            <option value="weekly">Hàng tuần</option>
          </select>
          <button
            className="btn-primary"
            onClick={addReminder}
            disabled={!form.title.trim() || !form.time}
          >
            ✓ Lưu nhắc nhở
          </button>
        </div>
      )}

      <div className="reminder-list">
        {pending.length === 0 && !showForm && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>Chưa có nhắc nhở nào</p>
            <button className="btn-outline" onClick={() => setShowForm(true)}>Thêm ngay</button>
          </div>
        )}

        {pending.map(r => {
          const cat = catOf(r.category);
          return (
            <div key={r.id} className="reminder-card">
              <button className="check-circle" onClick={() => toggle(r.id)} />
              <div className="reminder-body">
                <div className="reminder-title">{cat.icon} {r.title}</div>
                <div className="reminder-meta">
                  🕐 {r.time}
                  {r.date && ` · ${new Date(r.date + 'T00:00').toLocaleDateString('vi-VN')}`}
                  {r.repeat === 'daily' && ' · 🔁 Hàng ngày'}
                  {r.repeat === 'weekly' && ' · 🔁 Hàng tuần'}
                </div>
              </div>
              <button className="icon-btn danger" onClick={() => remove(r.id)}>🗑️</button>
            </div>
          );
        })}

        {done.length > 0 && (
          <>
            <div className="section-label">Đã xong ({done.length})</div>
            {done.map(r => {
              const cat = catOf(r.category);
              return (
                <div key={r.id} className="reminder-card done">
                  <button className="check-circle checked" onClick={() => toggle(r.id)}>✓</button>
                  <div className="reminder-body">
                    <div className="reminder-title">{cat.icon} {r.title}</div>
                    <div className="reminder-meta">🕐 {r.time}</div>
                  </div>
                  <button className="icon-btn danger" onClick={() => remove(r.id)}>🗑️</button>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
