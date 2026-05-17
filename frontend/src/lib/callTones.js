let audioCtx = null;

async function ensureAudioContext() {
  try {
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }
    return audioCtx.state === "running" ? audioCtx : null;
  } catch {
    return null;
  }
}

function getReadyAudioContext() {
  if (audioCtx && audioCtx.state === "running") {
    return audioCtx;
  }
  return null;
}

export function createRingtone() {
  let intervalId = null;
  let isPlaying = false;
  let pendingTimeouts = [];

  const play = async () => {
    if (isPlaying) return;
    isPlaying = true;

    await ensureAudioContext();

    const playBeep = () => {
      if (!isPlaying) return;

      const ctx = getReadyAudioContext();
      if (!ctx) return;

      try {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        gain1.gain.setValueAtTime(0.15, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.4);

        const tid = setTimeout(() => {
          if (!isPlaying) return;
          const ctx2 = getReadyAudioContext();
          if (!ctx2) return;
          try {
            const osc2 = ctx2.createOscillator();
            const gain2 = ctx2.createGain();
            osc2.type = "sine";
            osc2.frequency.setValueAtTime(554, ctx2.currentTime);
            gain2.gain.setValueAtTime(0.15, ctx2.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, ctx2.currentTime + 0.4);
            osc2.connect(gain2);
            gain2.connect(ctx2.destination);
            osc2.start(ctx2.currentTime);
            osc2.stop(ctx2.currentTime + 0.4);
          } catch {""}
        }, 500);
        pendingTimeouts.push(tid);
      } catch {""}
    };

    playBeep();
    intervalId = setInterval(playBeep, 2000);
  };

  const stop = () => {
    isPlaying = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    pendingTimeouts.forEach((tid) => clearTimeout(tid));
    pendingTimeouts = [];
  };

  return { play, stop };
}

export function createOutgoingTone() {
  let intervalId = null;
  let isPlaying = false;

  const play = async () => {
    if (isPlaying) return;
    isPlaying = true;

    await ensureAudioContext();

    const playRingback = () => {
      if (!isPlaying) return;

      const ctx = getReadyAudioContext();
      if (!ctx) return;

      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(425, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.0);
      } catch {""}
    };

    playRingback();
    intervalId = setInterval(playRingback, 3000);
  };

  const stop = () => {
    isPlaying = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  return { play, stop };
}

export async function playCallEndTone() {
  const ctx = await ensureAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {""}
}
