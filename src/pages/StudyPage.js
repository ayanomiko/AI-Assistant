import React, { useState, useEffect, useRef } from 'react';
import { sendMessage } from '../services/gemini';

const WORK_SECS  = 25 * 60;
const BREAK_SECS = 5 * 60;

function fmt(secs) {
  return `${String(Math.floor(secs / 60)).padStart(2,'0')}:${String(secs % 60).padStart(2,'0')}`;
}

function load(k, fb) {
  try { return JSON.parse(localStorage.getItem(k)) ?? fb; }
  catch { return fb; }
}

export default function StudyPage() {
  // --- Pomodoro ---
  const [running,  setRunning]  = useState(false);
  const [isBreak,  setIsBreak]  = useState(false);
  const [timeLeft, setTimeLeft] = useState(WORK_SECS);
  const [sessions, setSessions] = useState(0);
  const tickRef = useRef(null);

  // --- Subject & AI Q&A ---
  const [subject,   setSubject]   = useState('');
  const [question,  setQuestion]  = useState('');
  const [answer,    setAnswer]    = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // --- Notes ---
  const [notes,     setNotes]     = useState(() => load('study_notes', []));
  const [noteInput, setNoteInput] = useState('');

  const total = isBreak ? BREAK_SECS : WORK_SECS;
  const progress = ((total - timeLeft) / total) * 100;
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - progress / 100);

  useEffect(() => {
    if (!running) { clearInterval(tickRef.current); return; }
    tickRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(tickRef.current);
          const nextBreak = !isBreak;
          if (!nextBreak) setSessions(s => s + 1);
          setIsBreak(nextBreak);
          setRunning(false);
          setTimeLeft(nextBreak ? BREAK_SECS : WORK_SECS);
          if (Notification.permission === 'granted') {
            new Notification(nextBreak ? '☕ Nghỉ 5 phút nào!' : '📖 Tiếp tục học thôi!', {
              icon: '/logo192.png',
            });
          }
          return nextBreak ? BREAK_SECS : WORK_SECS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running, isBreak]);

  const toggleTimer = () => {
    if (!running && !isBreak) Notification.requestPermission();
    setRunning(r => !r);
  };

  const resetTimer = () => {
    setRunning(false);
    setIsBreak(false);
    setTimeLeft(WORK_SECS);
  };

  const askAI = async () => {
    if (!question.trim() || aiLoading) return;
    setAiLoading(true);
    setAnswer('');
    try {
      const prompt = subject
        ? `Môn: ${subject}\nCâu hỏi: ${question}\nGiải thích ngắn gọn, dễ hiểu bằng tiếng Việt.`
        : `Câu hỏi học tập: ${question}\nGiải thích ngắn gọn, dễ hiểu bằng tiếng Việt.`;
      setAnswer(await sendMessage(prompt));
    } catch {
      setAnswer('❌ Không kết nối được AI. Kiểm tra API key trong tab Chat.');
    } finally {
      setAiLoading(false);
    }
  };

  const saveNote = () => {
    if (!noteInput.trim()) return;
    const updated = [
      { id: Date.now(), text: noteInput.trim(), subject, time: new Date().toLocaleString('vi-VN') },
      ...notes,
    ].slice(0, 50);
    setNotes(updated);
    localStorage.setItem('study_notes', JSON.stringify(updated));
    setNoteInput('');
  };

  const deleteNote = (id) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    localStorage.setItem('study_notes', JSON.stringify(updated));
  };

  return (
    <div className="page-scroll">
      <div className="page-header">
        <h2 className="page-title">📚 Học bài</h2>
        <span className="badge">🍅 {sessions}</span>
      </div>

      {/* Pomodoro */}
      <div className={`pomodoro-card ${isBreak ? 'break' : 'work'}`}>
        <div className="pomo-label">{isBreak ? '☕ Nghỉ giải lao' : '📖 Tập trung học'}</div>
        <div className="pomo-ring-wrap">
          <svg className="pomo-svg" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" className="pomo-track" />
            <circle
              cx="60" cy="60" r="54"
              className="pomo-progress"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="pomo-time">{fmt(timeLeft)}</div>
        </div>
        <div className="pomo-controls">
          <button className="pomo-btn reset" onClick={resetTimer}>↺</button>
          <button className={`pomo-btn main ${running ? 'pause' : 'play'}`} onClick={toggleTimer}>
            {running ? '⏸' : '▶'}
          </button>
        </div>
      </div>

      {/* Subject */}
      <input
        className="input-field"
        type="text"
        placeholder="📝 Môn học (Toán, Lý, Anh...)"
        value={subject}
        onChange={e => setSubject(e.target.value)}
      />

      {/* AI Q&A */}
      <div className="section-card">
        <h3 className="section-title">🤖 Hỏi Aria</h3>
        <textarea
          className="input-field"
          placeholder="Đặt câu hỏi về bài học..."
          value={question}
          onChange={e => setQuestion(e.target.value)}
          rows={3}
        />
        <button
          className="btn-primary"
          onClick={askAI}
          disabled={aiLoading || !question.trim()}
        >
          {aiLoading ? '⏳ Đang tìm...' : '🔍 Hỏi ngay'}
        </button>

        {answer && (
          <div className="answer-box">
            <div className="answer-label">💡 Trả lời:</div>
            <div className="answer-text">
              {answer.split('\n').map((line, i, arr) => (
                <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>
              ))}
            </div>
            <button
              className="btn-outline sm"
              onClick={() => setNoteInput(`Q: ${question}\n\nA: ${answer}`)}
            >
              📌 Lưu ghi chú
            </button>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="section-card">
        <h3 className="section-title">📓 Ghi chú</h3>
        <div className="row gap-8">
          <textarea
            className="input-field flex-1"
            placeholder="Thêm ghi chú nhanh..."
            value={noteInput}
            onChange={e => setNoteInput(e.target.value)}
            rows={2}
          />
          <button className="btn-icon-lg" onClick={saveNote} disabled={!noteInput.trim()}>+</button>
        </div>
        <div className="notes-list">
          {notes.length === 0 && <p className="muted-text">Chưa có ghi chú nào.</p>}
          {notes.slice(0, 10).map(n => (
            <div key={n.id} className="note-card">
              <div className="note-top">
                {n.subject && <span className="note-badge">{n.subject}</span>}
                <button className="icon-btn danger sm" onClick={() => deleteNote(n.id)}>✕</button>
              </div>
              <p className="note-text">{n.text}</p>
              <span className="note-time">{n.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
