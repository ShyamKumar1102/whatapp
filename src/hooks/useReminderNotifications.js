import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const POLL_INTERVAL = 30 * 1000; // check every 30 seconds
const STAGES_KEY = 'crm_reminder_stages'; // tracks which stage each reminder has reached

// Stages: 0=none, 1=60min, 2=5min, 3=1min, 4=due, 5=completed
const getStages = () => {
  try { return JSON.parse(localStorage.getItem(STAGES_KEY) || '{}'); }
  catch { return {}; }
};

const getStage = (id) => getStages()[id] || 0;

const setStage = (id, stage) => {
  const map = getStages();
  map[id] = stage;
  localStorage.setItem(STAGES_KEY, JSON.stringify(map));
};

const clearStage = (id) => {
  const map = getStages();
  delete map[id];
  localStorage.setItem(STAGES_KEY, JSON.stringify(map));
};

const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';

    if (type === 'info') {
      // 1 soft ding — 60 min warning
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'warning') {
      // 2 dings — 5 min warning
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
      // second ding
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2); gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.4);
      gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.4);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc2.start(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.7);
    } else if (type === 'error') {
      // 3 urgent beeps — 1 min / due now
      [0, 0.3, 0.6].forEach(t => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(1100, ctx.currentTime + t);
        g.gain.setValueAtTime(0.4, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
        o.start(ctx.currentTime + t);
        o.stop(ctx.currentTime + t + 0.2);
      });
    } else if (type === 'success') {
      // ascending chime — completed
      [523, 659, 784].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        g.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3);
        o.start(ctx.currentTime + i * 0.15);
        o.stop(ctx.currentTime + i * 0.15 + 0.3);
      });
    }
  } catch { /* ignore */ }
};

const notify = (type, title, desc, reminderId, permissionRef) => {
  // In-app toast
  const toastFn = type === 'error' ? toast.error : type === 'warning' ? toast.warning : type === 'success' ? toast.success : toast.info;
  toastFn(title, { description: desc, duration: 10000 });

  // Sound
  playSound(type);

  // Browser notification
  if (permissionRef.current === 'granted') {
    new Notification(title, { body: desc, icon: '/favicon.ico', tag: `${reminderId}-${type}` });
  }
};

export default function useReminderNotifications() {
  const permissionRef = useRef(Notification.permission);
  const prevCompleted = useRef(new Set());

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(p => { permissionRef.current = p; });
    }
  }, []);

  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem('crm_token');
      if (!token) return;
      try {
        const res  = await fetch(`${BACKEND}/api/reminders`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!data.success) return;

        const now = new Date();

        data.data.forEach(r => {
          const stage = getStage(r.id);

          // ── Completed ─────────────────────────────────────────
          if (r.status === 'completed') {
            if (!prevCompleted.current.has(r.id)) {
              prevCompleted.current.add(r.id);
              notify('success', '✅ Reminder Completed', r.title, r.id, permissionRef);
              clearStage(r.id);
            }
            return;
          }

          if (!r.due_date) return;

          const due     = new Date(r.due_date);
          const diffMin = (due - now) / 60000; // minutes remaining

          // ── Due (overdue, 0 or less) — stage 4 ───────────────
          if (diffMin <= 0 && stage < 4) {
            notify('error', '🔔 Reminder Due Now!', r.title, r.id, permissionRef);
            setStage(r.id, 4);
            return;
          }

          // ── ≤ 1 minute — stage 3 ─────────────────────────────
          if (diffMin <= 1 && stage < 3) {
            notify('error', '⏰ Due in 1 minute!', r.title, r.id, permissionRef);
            setStage(r.id, 3);
            return;
          }

          // ── ≤ 5 minutes — stage 2 ────────────────────────────
          if (diffMin <= 5 && stage < 2) {
            notify('warning', '⚠️ Due in 5 minutes', r.title, r.id, permissionRef);
            setStage(r.id, 2);
            return;
          }

          // ── ≤ 60 minutes — stage 1 ───────────────────────────
          if (diffMin <= 60 && stage < 1) {
            notify('info', '🕐 Reminder in 1 hour', r.title, r.id, permissionRef);
            setStage(r.id, 1);
            return;
          }
        });
      } catch { /* ignore */ }
    };

    check();
    const interval = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);
}
