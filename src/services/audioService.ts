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
   * Putar audio murottal tartil dengan dukungan fallback URL dan autoplay recovery
   */
  public playTartil(audioUrl: string, volume = 0.8, startOffsetSeconds = 0): Promise<void> {
    return new Promise((resolve) => {
      this.stopTartil();
      if (!audioUrl) {
        resolve();
        return;
      }

      // Daftar kandidat URL: coba HTTPS original, lalu coba fallback domain mirrors jika ada kendala koneksi di STB
      const candidates: string[] = [audioUrl];

      // Jika URL dari islamic.network (misal https://cdn.islamic.network/quran/audio/128/ar.alafasy/67.mp3),
      // tambahkan alternative link seperti everyayah.com atau HTTP mirror jika SSL bermasalah di Android lawas
      if (audioUrl.includes('cdn.islamic.network/quran/audio/128/ar.alafasy/')) {
        const surahMatch = audioUrl.match(/\/(\d+)\.mp3$/);
        if (surahMatch) {
          const surahNum = parseInt(surahMatch[1], 10);
          const paddedSurah = String(surahNum).padStart(3, '0');
          // Candidate 2: everyayah.com mirror
          candidates.push(`https://everyayah.com/data/Alafasy_128kbps/${paddedSurah}001.mp3`);
          // Candidate 3: HTTP fallback (untuk Android WebView STB lawas yang sertifikat SSL Let's Encrypt-nya expired)
          candidates.push(audioUrl.replace('https://', 'http://'));
        }
      }

      let candidateIndex = 0;

      const tryPlayCurrentCandidate = () => {
        if (candidateIndex >= candidates.length) {
          console.warn('⚠️ Semua sumber audio murottal gagal dimuat di STB.');
          resolve();
          return;
        }

        const currentUrl = candidates[candidateIndex];
        try {
          const audio = new Audio();
          // Pengaturan penting untuk Android WebView & Cross-Origin media
          audio.crossOrigin = 'anonymous';
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

          audio.onended = () => resolve();

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
                console.log('▶️ Berhasil memutar murottal di STB:', currentUrl);
                resolve();
              })
              .catch((err) => {
                console.warn('Autoplay prevented on STB or audio source interaction required:', err);
                // Listener sentuh/klik jika browser STB memblokir autoplay audio MP3
                const resumeOnInteraction = () => {
                  this.unlockAudio();
                  if (this.currentTartilAudio) {
                    this.currentTartilAudio.play().catch(() => {});
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
