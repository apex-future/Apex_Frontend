/**
 * soundManager.js — Web Audio API sound synthesis for Apex.
 *
 * All sounds are procedurally generated. No audio files needed.
 * Singleton pattern — import and call anywhere.
 *
 * Usage:
 *   import soundManager from '../utils/soundManager';
 *   soundManager.init();          // call on first user gesture
 *   soundManager.play('quest_complete');
 *   soundManager.setEnabled(false); // mute
 */

const soundManager = (() => {
  let ctx = null;
  let enabled = true;

  // ─── Context init ───────────────────────────────────────────────────────────

  /**
   * init — creates the AudioContext. Must be called from a
   * user gesture handler (tap, click). Safe to call multiple times.
   */
  function init() {
    if (ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn('[Sound] Web Audio API not supported');
        return;
      }
      ctx = new AudioContext();
      if (import.meta.env.DEV) {
        console.log('[Sound] AudioContext created:', ctx.state);
      }
    } catch (e) {
      console.warn('[Sound] AudioContext init failed:', e);
    }
  }

  /**
   * resume — resumes a suspended context (required after
   * browser auto-suspends on background). Called before every
   * sound play.
   */
  async function resume() {
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        // silent — sound just won't play
      }
    }
  }

  // ─── Master enable / disable ────────────────────────────────────────────────

  function setEnabled(val) {
    enabled = Boolean(val);
    if (import.meta.env.DEV) {
      console.log('[Sound] enabled:', enabled);
    }
  }

  function isEnabled() {
    return enabled;
  }

  // ─── Internal helpers ───────────────────────────────────────────────────────

  /**
   * osc — creates, connects, starts, and stops an oscillator.
   * Returns the oscillator node.
   */
  function osc(frequency, type, startTime, duration, peakGain, destination) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(
      0.001, startTime + duration
    );

    oscillator.connect(gain);
    gain.connect(destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.05);

    return oscillator;
  }

  /**
   * noise — creates a white noise buffer and connects it
   * through a gain envelope. Used for shimmer / impact.
   */
  function noise(startTime, duration, peakGain, destination, filter) {
    const bufferSize = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2) - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    if (filter) {
      const bpf = ctx.createBiquadFilter();
      bpf.type = filter.type || 'bandpass';
      bpf.frequency.value = filter.frequency || 2000;
      bpf.Q.value = filter.Q || 1;
      source.connect(bpf);
      bpf.connect(gain);
    } else {
      source.connect(gain);
    }

    gain.connect(destination);
    source.start(startTime);
    source.stop(startTime + duration + 0.05);
  }

  // ─── Sound definitions ──────────────────────────────────────────────────────

  const sounds = {

    /**
     * quest_complete — ascending two-note chime.
     * C5 then G5. Clean sine. Short decay.
     * Feel: satisfying micro-reward.
     */
    quest_complete() {
      const master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      const t = ctx.currentTime;

      osc(523.25, 'sine', t,        0.35, 0.6, master); // C5
      osc(783.99, 'sine', t + 0.13, 0.35, 0.5, master); // G5
    },

    /**
     * chest_rumble — low bass pulse, growing intensity.
     * Layered sine waves on sub-bass frequencies.
     * Feel: something is about to break out.
     */
    chest_rumble() {
      const master = ctx.createGain();
      master.gain.value = 0.4;
      master.connect(ctx.destination);
      const t = ctx.currentTime;

      // Sub-bass throb — three pulses growing in gain
      [0, 0.12, 0.26].forEach((offset, i) => {
        const g = 0.3 + i * 0.15;
        osc(55,  'sine',     t + offset, 0.18, g,    master);
        osc(110, 'triangle', t + offset, 0.18, g * 0.4, master);
      });

      // High shimmer building on top
      noise(t + 0.2, 0.3, 0.06, master, {
        type: 'bandpass',
        frequency: 3000,
        Q: 2,
      });
    },

    /**
     * chest_open — sharp impact then bright shimmer.
     * Low thud + noise burst + high sparkle.
     * Feel: something bursting open with energy.
     */
    chest_open() {
      const master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
      const t = ctx.currentTime;

      // Thud — pitched down fast
      const thud = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(180, t);
      thud.frequency.exponentialRampToValueAtTime(40, t + 0.08);
      thudGain.gain.setValueAtTime(0.8, t);
      thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      thud.connect(thudGain);
      thudGain.connect(master);
      thud.start(t);
      thud.stop(t + 0.15);

      // Noise burst
      noise(t, 0.06, 0.5, master, null);

      // High shimmer sparkle
      noise(t + 0.05, 0.55, 0.18, master, {
        type: 'highpass',
        frequency: 4000,
        Q: 0.5,
      });

      // Ascending sparkle tones
      [880, 1108, 1318, 1760].forEach((freq, i) => {
        osc(freq, 'sine', t + 0.04 + i * 0.04, 0.3, 0.2, master);
      });
    },

    /**
     * item_reveal — soft whoosh as a card flips up.
     * Rising filtered noise + gentle mid tone.
     * Feel: something materializing from nothing.
     */
    item_reveal() {
      const master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
      const t = ctx.currentTime;

      // Whoosh — bandpass noise sweeping up
      const bufferSize = Math.ceil(ctx.sampleRate * 0.25);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2) - 1;

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.setValueAtTime(600, t);
      bpf.frequency.exponentialRampToValueAtTime(2400, t + 0.2);
      bpf.Q.value = 1.5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.5, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      source.connect(bpf);
      bpf.connect(gain);
      gain.connect(master);
      source.start(t);
      source.stop(t + 0.28);

      // Gentle materialise tone
      osc(440, 'sine', t + 0.05, 0.2, 0.25, master);
    },

    /**
     * claim_success — satisfying triple clink.
     * Three short high-pitched sine pings in quick succession.
     * Feel: coins collected, reward banked.
     */
    claim_success() {
      const master = ctx.createGain();
      master.gain.value = 0.45;
      master.connect(ctx.destination);
      const t = ctx.currentTime;

      const freqs = [1046.5, 1318.5, 1567.98]; // C6, E6, G6
      freqs.forEach((freq, i) => {
        osc(freq, 'sine', t + i * 0.1, 0.25, 0.5, master);
        // Subtle harmonic overtone per clink
        osc(freq * 2, 'sine', t + i * 0.1, 0.15, 0.1, master);
      });
    },

    /**
     * level_up — rising orchestral-style swell.
     * Layered oscillators building from bass to treble,
     * filter sweep, harmonic resolution at the peak.
     * Feel: identity shift. Something permanent happened.
     * Duration: ~2.8 seconds.
     */
    level_up() {
      const master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      const t = ctx.currentTime;

      // ── Layer 1: Deep bass foundation ──────────────────────────────
      osc(65.4,  'sine',     t,        2.0, 0.5,  master); // C2
      osc(130.8, 'triangle', t,        2.0, 0.3,  master); // C3

      // ── Layer 2: Mid rising arpeggio ───────────────────────────────
      const arpNotes = [261.6, 329.6, 392, 523.3, 659.3]; // C4 E4 G4 C5 E5
      arpNotes.forEach((freq, i) => {
        osc(freq, 'sine', t + i * 0.22, 0.6, 0.35, master);
      });

      // ── Layer 3: Harmonic resolution chord ─────────────────────────
      // Fires at t+1.2 — the emotional peak
      [523.3, 659.3, 783.99, 1046.5].forEach((freq, i) => {
        const chordGain = ctx.createGain();
        chordGain.gain.setValueAtTime(0, t + 1.2);
        chordGain.gain.linearRampToValueAtTime(0.3, t + 1.35);
        chordGain.gain.exponentialRampToValueAtTime(0.001, t + 2.8);
        chordGain.connect(master);

        const o = ctx.createOscillator();
        o.type = i === 0 ? 'sine' : 'triangle';
        o.frequency.value = freq;
        o.connect(chordGain);
        o.start(t + 1.2);
        o.stop(t + 3.0);
      });

      // ── Layer 4: Noise shimmer sweeping up through the swell ───────
      const noiseBuffer = ctx.createBuffer(
        1,
        Math.ceil(ctx.sampleRate * 2.5),
        ctx.sampleRate
      );
      const nd = noiseBuffer.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2) - 1;

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const sweepFilter = ctx.createBiquadFilter();
      sweepFilter.type = 'bandpass';
      sweepFilter.frequency.setValueAtTime(200, t);
      sweepFilter.frequency.exponentialRampToValueAtTime(6000, t + 1.4);
      sweepFilter.frequency.exponentialRampToValueAtTime(2000, t + 2.5);
      sweepFilter.Q.value = 2;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, t);
      noiseGain.gain.linearRampToValueAtTime(0.12, t + 0.3);
      noiseGain.gain.linearRampToValueAtTime(0.2, t + 1.2);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 2.8);

      noiseSource.connect(sweepFilter);
      sweepFilter.connect(noiseGain);
      noiseGain.connect(master);
      noiseSource.start(t);
      noiseSource.stop(t + 2.8);

      // ── Layer 5: Final high sparkle burst at peak ──────────────────
      [2093, 2637, 3136].forEach((freq, i) => {
        osc(freq, 'sine', t + 1.25 + i * 0.06, 0.6, 0.15, master);
      });
    },

  };

  // ─── Public play API ────────────────────────────────────────────────────────

  /**
   * play — plays a named sound.
   * Safe to call even if AudioContext is not ready — fails silently.
   *
   * @param {string} name — one of the keys in sounds object
   */
  async function play(name) {
    if (!enabled) return;
    if (!ctx) {
      if (import.meta.env.DEV) {
        console.warn('[Sound] play() called before init() —'
          + ' call soundManager.init() on first user gesture');
      }
      return;
    }
    await resume();
    const fn = sounds[name];
    if (!fn) {
      if (import.meta.env.DEV) {
        console.warn('[Sound] Unknown sound:', name);
      }
      return;
    }
    try {
      fn();
      if (import.meta.env.DEV) {
        console.log('[Sound] Playing:', name);
      }
    } catch (e) {
      console.warn('[Sound] Playback error for', name, ':', e);
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  return {
    init,
    play,
    setEnabled,
    isEnabled,
  };
})();

export default soundManager;

// ─── DEV smoke test ────────────────────────────────────────────────────────
// Open browser console and run: window.__apexSoundTest('level_up')
if (import.meta.env.DEV) {
  window.__apexSoundTest = (name) => {
    soundManager.init();
    soundManager.play(name || 'quest_complete');
  };
}
