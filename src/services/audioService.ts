/**
 * Audio Service untuk Auto-Tartil, Adzan alert beeper, dan hitung mundur Iqomah.
 * Menggunakan Web Audio API untuk beeper offline 100% tanpa file audio eksternal,
 * dan HTML5 Audio untuk pemutaran murottal MP3.
 */

export type TartilAudioStatus = 'idle' | 'loading' | 'playing' | 'error' | 'blocked';

class AudioService {
  private audioCtx: AudioContext | null = null;
  private currentTartilAudio: HTMLAudioElement | null = null;
  private currentTartilUrl: string | null = null;
  private isUnlocked = false;
  private tartilStatus: TartilAudioStatus = 'idle';
  private statusListeners: Set<(status: TartilAudioStatus) => void> = new Set();

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

    // Trigger dummy playback to unlock HTMLMediaElement in Android WebView
    try {
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
      silentAudio.play().then(() => silentAudio.pause()).catch(() => {});
    } catch {
      // ignore
    }

    // If tartil audio is currently loaded but paused due to autoplay restriction, resume it immediately
    if (this.currentTartilAudio && this.currentTartilAudio.paused) {
      this.currentTartilAudio.play().then(() => {
        this.setTartilStatus('playing');
      }).catch((e) => {
        console.warn('Resume on unlock failed:', e);
      });
    }
  }

  public getUnlocked(): boolean {
    return this.isUnlocked;
  }

  public getTartilStatus(): TartilAudioStatus {
    return this.tartilStatus;
  }

  public subscribeTartilStatus(listener: (status: TartilAudioStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.tartilStatus);
    return () => this.statusListeners.delete(listener);
  }

  private setTartilStatus(status: TartilAudioStatus) {
    this.tartilStatus = status;
    this.statusListeners.forEach((fn) => {
      try {
        fn(status);
      } catch (err) {
        console.error('Status listener error:', err);
      }
    });
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
   * Putar audio murottal tartil dengan dukungan fallback URL dan autoplay recovery
   */
  public playTartil(audioUrl: string, volume = 0.8, startOffsetSeconds = 0): Promise<void> {
    return new Promise((resolve) => {
      if (!audioUrl) {
        this.stopTartil();
        resolve();
        return;
      }

      // Jika URL yang sama sudah sedang berputar, jangan di-restart untuk mencegah interupsi audio
      if (this.currentTartilAudio && this.currentTartilUrl === audioUrl && !this.currentTartilAudio.paused) {
        this.currentTartilAudio.volume = Math.max(0, Math.min(1, volume));
        this.setTartilStatus('playing');
        resolve();
        return;
      }

      this.stopTartil();
      this.currentTartilUrl = audioUrl;
      this.setTartilStatus('loading');

      // Daftar kandidat URL: prioritaskan Cloudflare CDN berkecepatan tinggi (mp3quran) jika surah terdeteksi
      const candidates: string[] = [];

      const surahMatch = audioUrl.match(/(?:audio|audio-surah|afs)?\/.*?(\d{1,3})\.mp3(?:$|\?)/i) || audioUrl.match(/(\d{1,3})\.mp3(?:$|\?)/);
      if (surahMatch) {
        const surahNum = parseInt(surahMatch[1], 10);
        if (surahNum >= 1 && surahNum <= 114) {
          const paddedSurah = String(surahNum).padStart(3, '0');
          // Prioritas 1: server8.mp3quran.net (Cloudflare CDN, full surah, CORS Access-Control-Allow-Origin: *)
          candidates.push(`https://server8.mp3quran.net/afs/${paddedSurah}.mp3`);
          // Prioritas 2: everyayah.com
          candidates.push(`https://everyayah.com/data/Alafasy_128kbps/${paddedSurah}001.mp3`);
          // Prioritas 3: cdn.islamic.network full surah endpoint
          candidates.push(`https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${surahNum}.mp3`);
        }
      }

      // Masukkan original audioUrl jika belum ada di list
      if (!candidates.includes(audioUrl)) {
        candidates.push(audioUrl);
      }

      let candidateIndex = 0;

      const tryPlayCurrentCandidate = () => {
        if (candidateIndex >= candidates.length) {
          console.warn('⚠️ Semua sumber audio murottal gagal dimuat di STB.');
          this.setTartilStatus('error');
          resolve();
          return;
        }

        const currentUrl = candidates[candidateIndex];
        try {
          const audio = new Audio();
          // Catatan penting: JANGAN set audio.crossOrigin = 'anonymous'!
          // Menyetel crossOrigin akan memaksa pengecekan CORS yang memblokir CDN audio tanpa header CORS.
          audio.preload = 'auto';
          audio.src = currentUrl;
          audio.volume = Math.max(0, Math.min(1, volume));
          this.currentTartilAudio = audio;

          if (startOffsetSeconds > 0) {
            const seekHandler = () => {
              if (audio.duration && startOffsetSeconds < audio.duration) {
                audio.currentTime = startOffsetSeconds;
              }
            };
            audio.addEventListener('loadedmetadata', seekHandler, { once: true });
          }

          audio.onended = () => {
            this.setTartilStatus('idle');
            resolve();
          };

          audio.onerror = (e) => {
            console.warn(`Gagal memuat URL audio [${candidateIndex + 1}/${candidates.length}]: ${currentUrl}`, e);
            candidateIndex++;
            tryPlayCurrentCandidate();
          };

          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                this.isUnlocked = true;
                this.setTartilStatus('playing');
                console.log('▶️ Berhasil memutar murottal di STB:', currentUrl);
                resolve();
              })
              .catch((err) => {
                console.warn('Autoplay dicegah oleh STB / membutuhkan interaksi pengguna:', err);
                this.setTartilStatus('blocked');

                // Pasang listener interaksi sekali untuk auto-resume jika layar disentuh / remote ditekan
                const resumeOnInteraction = () => {
                  this.unlockAudio();
                  if (this.currentTartilAudio) {
                    this.currentTartilAudio.play().then(() => {
                      this.setTartilStatus('playing');
                    }).catch(() => {});
                  }
                  window.removeEventListener('click', resumeOnInteraction);
                  window.removeEventListener('keydown', resumeOnInteraction);
                  window.removeEventListener('touchstart', resumeOnInteraction);
                };
                window.addEventListener('click', resumeOnInteraction, { once: true });
                window.addEventListener('keydown', resumeOnInteraction, { once: true });
                window.addEventListener('touchstart', resumeOnInteraction, { once: true });
                resolve();
              });
          }
        } catch (err) {
          console.error('Failed to initialize tartil audio candidate:', err);
          candidateIndex++;
          tryPlayCurrentCandidate();
        }
      };

      tryPlayCurrentCandidate();
    });
  }

  /**
   * Hentikan audio murottal
   */
  public stopTartil() {
    if (this.currentTartilAudio) {
      try {
        this.currentTartilAudio.pause();
        this.currentTartilAudio.removeAttribute('src');
        this.currentTartilAudio.load();
      } catch (err) {
        console.warn('Error stopping tartil audio:', err);
      }
      this.currentTartilAudio = null;
    }
    this.currentTartilUrl = null;
    this.setTartilStatus('idle');
  }

  public isTartilPlaying(): boolean {
    return !!this.currentTartilAudio && !this.currentTartilAudio.paused;
  }
}

export const audioService = new AudioService();
