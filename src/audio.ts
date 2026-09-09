export class Sound {
  ctx: AudioContext | null = null;
  enabled = true;
  init() {
    if (!this.enabled) return;
    try {
      this.ctx ??= new AudioContext();
      void this.ctx.resume();
    } catch {
      /* Audio optional */
    }
  }
  note(
    freq: number,
    duration = 0.16,
    volume = 0.07,
    type: OscillatorType = "sine",
  ) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(volume, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + duration);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + duration);
  }
  collect(combo: number) {
    this.note([392, 440, 523.25, 587.33, 659.25, 783.99][combo % 6], 0.3);
  }
  switch() {
    this.note(220, 0.07, 0.025);
  }
  hit() {
    this.note(90, 0.22, 0.06, "triangle");
  }
  finish() {
    [523.25, 659.25, 783.99].forEach((f, i) =>
      setTimeout(() => this.note(f, 0.6, 0.05), i * 130),
    );
  }
}
