import { themes, musicalNote, musicLayers } from "./music.ts";
export class Sound {
  ctx: AudioContext | null = null;
  enabled = true;
  musicEnabled = true;
  world = 0;
  flavor = "neutral";
  private colorFilter: BiquadFilterNode | null = null;
  voices = 0;
  private musicBus: GainNode | null = null;
  private fxBus: GainNode | null = null;
  private pads: { osc: OscillatorNode; gain: GainNode }[] = [];
  private padWorld = -1;
  private beat = 0;
  private nextBeat = 0;
  init() {
    if (!this.enabled && !this.musicEnabled) return;
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
        const limiter = this.ctx.createDynamicsCompressor();
        limiter.threshold.value = -16;
        limiter.ratio.value = 6;
        limiter.connect(this.ctx.destination);
        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = 0;
        this.colorFilter = this.ctx.createBiquadFilter();
        this.colorFilter.type = "lowpass";
        this.musicBus.connect(this.colorFilter);
        this.colorFilter.connect(limiter);
        this.fxBus = this.ctx.createGain();
        this.fxBus.gain.value = 0.6;
        this.fxBus.connect(limiter);
      }
      void this.ctx.resume();
    } catch {}
  }
  private tone(
    freq: number,
    duration: number,
    volume: number,
    type: OscillatorType,
    bus: GainNode | null,
    when?: number,
  ) {
    if (!this.ctx || !bus || this.voices >= 24) return;
    const t = when ?? this.ctx.currentTime,
      o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(volume, t + 0.018);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g);
    g.connect(bus);
    this.voices++;
    o.onended = () => {
      o.disconnect();
      g.disconnect();
      this.voices--;
    };
    o.start(t);
    o.stop(t + duration + 0.02);
  }
  note(
    freq: number,
    duration = 0.16,
    volume = 0.07,
    type: OscillatorType = "sine",
  ) {
    if (this.enabled) this.tone(freq, duration, volume, type, this.fxBus);
  }
  collect(combo: number) {
    this.note(
      musicalNote(this.world, combo, combo >= 10 ? 1 : 0),
      0.28,
      0.06,
      themes[this.world].pad,
    );
  }
  switch() {
    this.note(musicalNote(this.world, 0, -1), 0.065, 0.02);
  }
  hit() {
    this.note(musicalNote(this.world, 0, -2), 0.2, 0.045, "triangle");
  }
  finish() {
    [0, 2, 4].forEach((n, i) => {
      if (this.enabled)
        this.tone(
          musicalNote(this.world, n),
          0.6,
          0.04,
          "sine",
          this.fxBus,
          (this.ctx?.currentTime ?? 0) + i * 0.13,
        );
    });
  }
  pause() {
    if (this.ctx && this.musicBus)
      this.musicBus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.06);
  }
  tick(
    world: number,
    intensity: number,
    combo: number,
    calm: boolean,
    active: boolean,
  ) {
    this.world = world;
    if (!this.ctx || !this.musicBus) return;
    const now = this.ctx.currentTime;
    this.colorFilter?.frequency.setTargetAtTime(
      this.flavor === "crystal"
        ? 9000
        : this.flavor === "deep"
          ? 1100
          : this.flavor === "warm"
            ? 2400
            : 5000,
      now,
      0.8,
    );
    if (!active || !this.musicEnabled) {
      this.pause();
      return;
    }
    this.musicBus.gain.setTargetAtTime(calm ? 0.3 : 0.42, now, 0.45);
    if (this.padWorld !== world) {
      for (const p of this.pads) {
        p.gain.gain.cancelScheduledValues(now);
        p.gain.gain.setTargetAtTime(0.0001, now, 0.3);
        p.osc.stop(now + 1.5);
        p.osc.onended = () => {
          p.osc.disconnect();
          p.gain.disconnect();
        };
      }
      this.pads = [];
      this.padWorld = world;
      for (const [i, degree] of [0, 2, 4].entries()) {
        const osc = this.ctx.createOscillator(),
          gain = this.ctx.createGain();
        osc.type = themes[world].pad;
        osc.frequency.value = musicalNote(world, degree, -1);
        osc.detune.value = (i - 1) * 3;
        gain.gain.value = 0;
        gain.gain.setTargetAtTime(0.03 / (i + 1), now, 0.6);
        osc.connect(gain);
        gain.connect(this.musicBus);
        osc.start();
        this.pads.push({ osc, gain });
      }
    }
    if (this.nextBeat < now - 0.25) this.nextBeat = now;
    const layers = musicLayers(intensity, combo, calm),
      seconds = 60 / themes[world].bpm / 2;
    if (this.nextBeat <= now + 0.08) {
      const t = this.nextBeat,
        motif = themes[world].motif[this.beat % 8];
      if (layers.pulse && this.beat % 2 === 0)
        this.tone(
          musicalNote(world, 0, -2),
          0.18,
          0.04,
          "triangle",
          this.musicBus,
          t,
        );
      if (layers.arp || this.beat % 8 === 0)
        this.tone(
          musicalNote(world, motif, 0),
          calm ? 1.5 : 0.5,
          calm ? 0.018 : 0.03,
          "sine",
          this.musicBus,
          t,
        );
      if (layers.combo && this.beat % 4 === 1)
        this.tone(
          musicalNote(world, motif, 1),
          0.4,
          0.018,
          "sine",
          this.musicBus,
          t,
        );
      if (layers.peak && this.beat % 2 === 1)
        this.tone(
          musicalNote(world, 2, -1),
          0.12,
          0.025,
          "triangle",
          this.musicBus,
          t,
        );
      this.beat++;
      this.nextBeat += seconds;
    }
  }
  get diagnostics() {
    return {
      world: this.world,
      flavor: this.flavor,
      music: this.musicEnabled,
      effects: this.enabled,
      voices: this.voices,
      pads: this.pads.length,
      state: this.ctx?.state ?? "not-started",
    };
  }
}
