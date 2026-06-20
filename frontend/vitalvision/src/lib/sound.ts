let audioCtx: AudioContext | null = null;
let enabled = true;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new Ctor();
    return audioCtx;
  } catch {
    return null;
  }
}

function loadEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem("vv-sound");
  return v === null ? true : v === "1";
}

enabled = loadEnabled();

export function isSoundEnabled(): boolean {
  return enabled;
}

export function setSoundEnabled(value: boolean): void {
  enabled = value;
  if (typeof window !== "undefined") {
    localStorage.setItem("vv-sound", value ? "1" : "0");
  }
}

function tone(freq: number, duration: number, opts: { gain?: number; type?: OscillatorType; attack?: number; release?: number; delay?: number } = {}) {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const { gain = 0.08, type = "sine", attack = 0.01, release = 0.15, delay = 0 } = opts;

  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);

  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.linearRampToValueAtTime(0, t0 + duration + release);

  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + release + 0.05);
}

// Soft two-note success chime
export function playSuccess(): void {
  tone(660, 0.12, { gain: 0.06, type: "sine", attack: 0.01, release: 0.18 });
  tone(880, 0.18, { gain: 0.05, type: "sine", attack: 0.01, release: 0.22, delay: 0.12 });
}

// Urgent three-pulse critical alert
export function playCritical(): void {
  for (let i = 0; i < 3; i++) {
    tone(740, 0.16, {
      gain: 0.08,
      type: "triangle",
      attack: 0.005,
      release: 0.08,
      delay: i * 0.28,
    });
  }
}

// Soft tick — for ticker / minor events
export function playTick(): void {
  tone(520, 0.05, { gain: 0.03, type: "sine", attack: 0.005, release: 0.04 });
}