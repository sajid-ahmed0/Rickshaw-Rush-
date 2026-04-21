class AudioManager {
  private ctx: AudioContext | null = null;
  private bgm: OscillatorNode | null = null;
  private bgmGain: GainNode | null = null;

  constructor() {}

  private init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  public playSound(type: 'jump' | 'coin' | 'crash' | 'powerup') {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;

    switch (type) {
      case 'jump':
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'coin':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'crash':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.5);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      case 'powerup':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
    }
  }

  public startBGM() {
    this.init();
    if (!this.ctx || this.bgm) return;

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    this.bgmGain.connect(this.ctx.destination);

    this.playSimpleMelody();
  }

  private playSimpleMelody() {
    if (!this.ctx || !this.bgmGain) return;
    
    const notes = [261.63, 293.66, 329.63, 349.23, 392.00]; // C4 to G4
    let currentNote = 0;

    const scheduleNextNote = () => {
        if (!this.ctx || !this.bgmGain) return;
        
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(notes[currentNote], this.ctx.currentTime);
        
        noteGain.gain.setValueAtTime(0.02, this.ctx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
        
        osc.connect(noteGain);
        noteGain.connect(this.bgmGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
        
        currentNote = (currentNote + 1) % notes.length;
        setTimeout(scheduleNextNote, 500);
    };

    scheduleNextNote();
  }
}

export const audioManager = new AudioManager();
