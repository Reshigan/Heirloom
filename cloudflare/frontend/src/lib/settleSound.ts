// The sound of the settle — a single low drop-note when an entry is lowered
// into the Deep (deep:settled). Feedback for the user's own act, never
// ambience: the product stays silent except at this one moment.
//
// Synthesized (no asset): a soft G3 tap sinking to E2 through a lowpass,
// gone in under 1.5s, whisper-level. The settle always follows a user
// gesture, so creating/resuming the AudioContext here is allowed.
// Opt out: localStorage heirloom-silent = "1".

let ctx: AudioContext | null = null;

function play(): void {
  try {
    if (localStorage.getItem('heirloom-silent') === '1') return;
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.055, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 440;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(196, t); // G3 — the tap on the surface
    osc.frequency.exponentialRampToValueAtTime(82.4, t + 0.6); // sinks to E2

    osc.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1.5);
  } catch {
    /* no audio is never an error — the Deep is quiet by nature */
  }
}

export function initSettleSound(): void {
  window.addEventListener('deep:settled', play);
}
