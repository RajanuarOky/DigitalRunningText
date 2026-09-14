/**
 * Audio Service untuk Auto-Tartil, Adzan alert beeper, dan hitung mundur Iqomah.
 * Menggunakan Web Audio API untuk beeper offline 100% tanpa file audio eksternal,
 * dan HTML5 Audio untuk pemutaran murottal MP3.
 */

class AudioService {
  private audioCtx: AudioContext | null = null;
  private currentTartilAudio: HTMLAudioElement | null = null;
  private isUnlocked = false;

  private initAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public unlockAudio() {
    this.initAudioContext();
    this.isUnlocked = true;
  }

  public getUnlocked(): boolean {
    return this.isUnlocked;
  }

  /**
   * Bunyi beep sintetis murni menggunakan Web Audio API (Offline-Safe)
   */
  public playBeep(frequency = 880, duration = 0.25, type: OscillatorType = 'sine', volume = 0.5) {
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Gagal memutar audio beep:', e);
    }
  }

  /**
   * Bunyi chime alarm masuk waktu adzan (Do - Mi - Sol - Do Tinggi)
   */
  public playAdzanChime() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playBeep(freq, 0.45, 'triangle', 0.6);
      }, idx * 300);
    });
  }

  /**
   * Bunyi peringatan iqomah (tit-tit-tit cepat)
   */
  public playIqomahAlert() {
    this.playBeep(1200, 0.15, 'square', 0.4);
    setTimeout(() => this.playBeep(1200, 0.15, 'square', 0.4), 200);
  }

  /**
   * Putar audio murottal tartil
   */
  public playTartil(audioUrl: string, volume = 0.8): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stopTartil();
      if (!audioUrl) {
        resolve();
        return;
      }

      try {
        const audio = new Audio(audioUrl);
        audio.volume = Math.max(0, Math.min(1, volume));
        this.currentTartilAudio = audio;

        audio.onended = () => resolve();
        audio.onerror = (e) => {
          console.warn('Error loading tartil audio file:', e);
          reject(e);
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => resolve()).catch((err) => {
            console.warn('Autoplay prevented or audio source failed:', err);
            resolve();
          });
        }
      } catch (err) {
        console.error('Failed to initialize tartil audio:', err);
        resolve();
      }
    });
  }

  /**
   * Hentikan audio murottal dengan fade out lembut
   */
  public stopTartil() {
    if (this.currentTartilAudio) {
      try {
        const audio = this.currentTartilAudio;
        let vol = audio.volume;
        const fadeInterval = setInterval(() => {
          vol -= 0.1;
          if (vol <= 0.05) {
            clearInterval(fadeInterval);
            audio.pause();
            audio.currentTime = 0;
          } else {
            audio.volume = vol;
          }
        }, 50);
      } catch {
        this.currentTartilAudio.pause();
      }
      this.currentTartilAudio = null;
    }
  }

  public isTartilPlaying(): boolean {
    return !!this.currentTartilAudio && !this.currentTartilAudio.paused;
  }
}

export const audioService = new AudioService();
