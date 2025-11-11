import { addStatBlock } from "./db-implementation.js";

// config
const DEFAULT_FOCUS_MIN = 25;
const DEFAULT_BREAK_MIN = 5;
const AUTO_START_NEXT_SESSION = true; 

let phase = 'focus';            // 'focus' | 'break'
let running = false;
let endAt = null;               // timestamp (ms) when current countdown ends
let remainingMs = 0;            // remaining time when paused


const statusEl = document.querySelector('#status-text');
const timeEl = document.querySelector('#time-left');

// Buttons: assumes 3 in #timer-buttons in order: play, pause, reset
const [playBtn, pauseBtn, resetBtn] = document.querySelectorAll('#timer-buttons a');

function getSubject() {
  const el = document.querySelector('#user-activity');
  const v = (el && el.value || '').trim();
  return v || 'Unlabeled';
}

// durationMs: number, endedAt: Date
async function logFocusSession(durationMs, endedAt = new Date()) {
  const statBlock = {
    date: endedAt.toISOString(),
    minutes: Math.round(durationMs / 60000),
    subject: getSubject(),
  };
  try {
    await addStatBlock(statBlock);
  } catch (err) {
    console.error("Unable to log focus session:", err);
  }
}

// utility functions
const minToMs = (m) => m * 60 * 1000;

function getDurationMs(p) {
  if (p === 'focus') return minToMs(DEFAULT_FOCUS_MIN);
  return minToMs(DEFAULT_BREAK_MIN);
}

function formatTime(ms) {
  ms = Math.max(0, Math.floor(ms));
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function setStatusText() {
  const state = running ? '' : ' (paused)';
  const label = phase === 'focus' ? 'Focus' : 'Break';
  statusEl.textContent = `${label}${state}`;
}

function setTimeDisplay(ms) {
  timeEl.textContent = formatTime(ms);
}

async function ensureNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

async function notify(title, body) {
  try {
    const ok = await ensureNotificationPermission();
    if (!ok) return;
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: '/assets/icons/icon-192.png',
          badge: '/assets/icons/icon-192.png',
          silent: false,
        });
        return;
      }
    }
    // Fallback
    new Notification(title, { body });
  } catch (_) { /* noop */ }
  if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
  if (window.M && M.toast) M.toast({ html: `${title}: ${body}` });
}

// timer functions
let intervalId = null;

async function tick() {
  const now = Date.now();
  const msLeft = endAt - now;

  if (msLeft <= 0) {
    clearInterval(intervalId);
    intervalId = null;
    running = false;
    setTimeDisplay(0);
    setStatusText();

    // logging
    if (phase === 'focus') {
      // Use planned duration or compute actual: Date.now() - (endAt - base)
      await logFocusSession(getDurationMs('focus'), new Date());
    }

    const nextPhase = phase === 'focus' ? 'break' : 'focus';
    await notify(
      `${phase === 'focus' ? 'Focus' : 'Break'} complete`,
      `Starting ${nextPhase} session`
    );
    switchPhase(nextPhase, AUTO_START_NEXT_SESSION);
    return;
  }

  setTimeDisplay(msLeft);
}

function startTimer() {
  const base = remainingMs > 0 ? remainingMs : getDurationMs(phase);
  endAt = Date.now() + base;
  running = true;
  localStorage.setItem('pomodoroEnd', endAt);
  setStatusText();
  tick(); // immediate update
  intervalId = setInterval(tick, 1000); // update every second
}

function pauseTimer() {
  if (!running) return;
  running = false;
  clearInterval(intervalId);
  intervalId = null;
  remainingMs = Math.max(0, endAt - Date.now());
  setStatusText();
}
// PWA won't run continued timers in background; i compromised here by saving end time to localStorage
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden) {
    const savedEnd = +localStorage.getItem('pomodoroEnd');
    if (!savedEnd) return;

    // If session already ended while app was backgrounded
    if (Date.now() >= savedEnd) {
      if (phase === 'focus') {
        await logFocusSession(getDurationMs('focus'), new Date(savedEnd));
      }
      await notify('Focus complete', 'Time to take a break!');
      switchPhase('break', true);
      localStorage.removeItem('pomodoroEnd');
    } else {
      // Still ongoing...
      const remaining = savedEnd - Date.now();
      setTimeDisplay(remaining);
      if (!running) remainingMs = remaining;
    }

  }
});


function resetTimer() {
  running = false;
  clearInterval(intervalId);
  intervalId = null;
  remainingMs = 0;
  setTimeDisplay(getDurationMs(phase));
  setStatusText();
}

function switchPhase(nextPhase, autoStart = false) {
  phase = nextPhase;
  running = false;
  clearInterval(intervalId);
  intervalId = null;
  remainingMs = 0;
  setTimeDisplay(getDurationMs(phase));
  setStatusText();
  if (autoStart) startTimer();
}


// Wire ui buttons
function wireButtons() {
  if (playBtn) {
    playBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await ensureNotificationPermission(); // ask once on first play
      startTimer();
    });
  }
  if (pauseBtn) {
    pauseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (running) pauseTimer(); else startTimer();
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resetTimer();
    });
  }
}

// keyboard shortcuts: Space=Play/Pause, R=Reset, B=Switch phase
function wireShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.target && /(input|textarea|select)/i.test(e.target.tagName)) return;
    if (e.code === 'Space') { e.preventDefault(); running ? pauseTimer() : startTimer(); }
    if (e.key.toLowerCase() === 'r') { e.preventDefault(); resetTimer(); }
    if (e.key.toLowerCase() === 'b') { e.preventDefault(); switchPhase(phase === 'focus' ? 'break' : 'focus', false); }
  });
}

// Init UI
document.addEventListener('DOMContentLoaded', () => {
  if (window.M && M.AutoInit) {  }

  setStatusText();
  setTimeDisplay(getDurationMs(phase));

  wireButtons();
  wireShortcuts();
});
