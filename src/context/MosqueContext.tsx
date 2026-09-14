import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
  SystemData,
  AppDisplayState,
  CalculatedPrayers,
  PrayerName,
} from '../types';
import { storageService } from '../services/storageService';
import { computePrayers } from '../services/prayerTimes';
import { audioService } from '../services/audioService';
import { channelService, type ChannelMessage } from '../services/channelService';
import { supabaseService } from '../services/supabaseService';

interface MosqueContextType {
  data: SystemData;
  updateData: (updater: (prev: SystemData) => SystemData) => void;
  resetData: () => void;
  currentTime: Date;
  prayers: CalculatedPrayers;
  displayState: AppDisplayState;
  activePrayerTarget: PrayerName | null;
  stateCountdownSeconds: number;
  isAudioUnlocked: boolean;
  unlockAudio: () => void;
  // Simulator & Quick Action controls
  simulateTartil: (prayerName?: PrayerName, durationSeconds?: number) => void;
  simulateAdzan: (prayerName?: PrayerName, durationSeconds?: number) => void;
  simulateIqomah: (prayerName?: PrayerName, minutes?: number) => void;
  simulatePrayerMode: (minutes?: number) => void;
  resetToNormal: () => void;
}

const MosqueContext = createContext<MosqueContextType | undefined>(undefined);

export const MosqueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<SystemData>(() => storageService.loadData());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [displayState, setDisplayState] = useState<AppDisplayState>('NORMAL');
  const [activePrayerTarget, setActivePrayerTarget] = useState<PrayerName | null>(null);
  const [stateCountdownSeconds, setStateCountdownSeconds] = useState<number>(0);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(false);
  const isSimulatingRef = useRef<boolean>(false);

  // Perhitungan jadwal sholat berdasarkan config terkini
  const prayers = useMemo(() => {
    return computePrayers(data.mosque, currentTime);
  }, [data.mosque, currentTime]);

  const unlockAudio = useCallback(() => {
    audioService.unlockAudio();
    setIsAudioUnlocked(true);
  }, []);

  // Handler aksi lokal saat menerima event simulasi (baik lokal maupun via BroadcastChannel)
  const applyLocalSimulateAdzan = useCallback((prayerName: PrayerName = 'maghrib', duration = 45) => {
    isSimulatingRef.current = true;
    audioService.stopTartil();
    audioService.playAdzanChime();
    setDisplayState('ADZAN');
    setActivePrayerTarget(prayerName);
    setStateCountdownSeconds(duration);
  }, []);

  const applyLocalSimulateTartil = useCallback((prayerName: PrayerName = 'maghrib', duration = 60) => {
    isSimulatingRef.current = true;
    setDisplayState('TARTIL');
    setActivePrayerTarget(prayerName);
    setStateCountdownSeconds(duration);
    const tartilCfg = data.tartil.prayers[prayerName as keyof typeof data.tartil.prayers];
    if (tartilCfg && tartilCfg.audioUrl) {
      audioService.playTartil(tartilCfg.audioUrl, data.tartil.volume);
    }
  }, [data]);

  const applyLocalSimulateIqomah = useCallback((prayerName: PrayerName = 'maghrib', durationSeconds = 120) => {
    isSimulatingRef.current = true;
    audioService.stopTartil();
    setDisplayState('IQOMAH');
    setActivePrayerTarget(prayerName);
    setStateCountdownSeconds(durationSeconds);
  }, []);

  const applyLocalSimulatePrayerMode = useCallback((durationSeconds = 60) => {
    isSimulatingRef.current = true;
    audioService.stopTartil();
    setDisplayState('PRAYER');
    setStateCountdownSeconds(durationSeconds);
  }, []);

  const applyLocalReset = useCallback(() => {
    isSimulatingRef.current = false;
    audioService.stopTartil();
    setDisplayState('NORMAL');
    setActivePrayerTarget(null);
    setStateCountdownSeconds(0);
  }, []);

  // Listener Cross-Tab Synchronization & Cloud Realtime
  useEffect(() => {
    // 1. Cross-Tab Local Broadcast Listener
    const unsubscribeLocal = channelService.subscribe((msg: ChannelMessage) => {
      switch (msg.type) {
        case 'SIMULATE_ADZAN':
          applyLocalSimulateAdzan(msg.prayerName, msg.durationSeconds);
          break;
        case 'SIMULATE_TARTIL':
          applyLocalSimulateTartil(msg.prayerName, msg.durationSeconds);
          break;
        case 'SIMULATE_IQOMAH':
          applyLocalSimulateIqomah(msg.prayerName, msg.durationSeconds);
          break;
        case 'SIMULATE_PRAYER':
          applyLocalSimulatePrayerMode(msg.durationSeconds);
          break;
        case 'RESET_NORMAL':
          applyLocalReset();
          break;
        case 'SYNC_DATA':
          setData(msg.data);
          break;
      }
    });

    // 2. Cloud Supabase Realtime Listener (Beda Jaringan / HP ke TV)
    if (supabaseService.isConfigured()) {
      supabaseService.fetchCloudData().then((cloudData) => {
        if (cloudData) {
          setData(cloudData);
          storageService.saveData(cloudData);
        } else {
          // Jika di Cloud belum ada data sama sekali, otomatis unggah data default ke Cloud
          const currentLocal = storageService.loadData();
          supabaseService.pushCloudData(currentLocal);
        }
      });

      supabaseService.subscribeRealtime(
        (cloudData) => {
          setData(cloudData);
          storageService.saveData(cloudData);
        },
        (cmd) => {
          if (cmd.action === 'ADZAN') applyLocalSimulateAdzan(cmd.prayerName, cmd.durationSeconds);
          if (cmd.action === 'TARTIL') applyLocalSimulateTartil(cmd.prayerName, cmd.durationSeconds);
          if (cmd.action === 'IQOMAH') applyLocalSimulateIqomah(cmd.prayerName, cmd.durationSeconds);
          if (cmd.action === 'PRAYER_MODE') applyLocalSimulatePrayerMode(cmd.durationSeconds);
          if (cmd.action === 'RESET_NORMAL') applyLocalReset();
        }
      );
    }

    return () => {
      unsubscribeLocal();
    };
  }, [
    applyLocalSimulateAdzan,
    applyLocalSimulateTartil,
    applyLocalSimulateIqomah,
    applyLocalSimulatePrayerMode,
    applyLocalReset,
  ]);

  const updateData = useCallback((updater: (prev: SystemData) => SystemData) => {
    setData((prev: SystemData) => {
      const next = updater(prev);
      storageService.saveData(next);
      channelService.broadcast({ type: 'SYNC_DATA', data: next });
      if (supabaseService.isConfigured()) {
        supabaseService.pushCloudData(next);
      }
      return next;
    });
  }, []);

  const resetData = useCallback(() => {
    const d = storageService.resetDefaults();
    setData(d);
    channelService.broadcast({ type: 'SYNC_DATA', data: d });
    if (supabaseService.isConfigured()) {
      supabaseService.pushCloudData(d);
    }
  }, []);

  // Clock tick & transisi otomatis ibadah
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Jika dalam mode simulasi, countdown manual per detik
      if (isSimulatingRef.current) {
        setStateCountdownSeconds((prev: number) => {
          if (prev <= 1) {
            // Transisi tahap simulasi berikutnya
            if (displayState === 'ADZAN') {
              setDisplayState('IQOMAH');
              return 60; // Lanjut ke demo iqomah 60 detik
            } else if (displayState === 'IQOMAH') {
              setDisplayState('PRAYER');
              return 45; // Lanjut ke demo sholat 45 detik
            } else {
              setDisplayState('NORMAL');
              isSimulatingRef.current = false;
              audioService.stopTartil();
              return 0;
            }
          }

          if (displayState === 'IQOMAH' && prev <= 10 && prev > 0) {
            audioService.playBeep(1050, 0.1, 'sine', 0.4);
          }
          return prev - 1;
        });
        return;
      }

      // 1. Pengecekan Waktu Adzan Masuk Real-Time
      // Jika adzan masuk terdeteksi dalam rentang waktu saat ini
      if (prayers.currentAdzanPrayer && displayState !== 'ADZAN' && displayState !== 'IQOMAH' && displayState !== 'PRAYER') {
        audioService.stopTartil();
        audioService.playAdzanChime();
        setDisplayState('ADZAN');
        setActivePrayerTarget(prayers.currentAdzanPrayer.name);
        setStateCountdownSeconds(90); // Tampilan adzan 90 detik
        return;
      }

      // 2. Transisi Adzan -> Iqomah
      if (displayState === 'ADZAN') {
        setStateCountdownSeconds((prev: number) => {
          if (prev <= 1) {
            const iqomahMinutes = (activePrayerTarget && data.iqomah.durations[activePrayerTarget as keyof typeof data.iqomah.durations]) || 8;
            setDisplayState('IQOMAH');
            return iqomahMinutes * 60;
          }
          return prev - 1;
        });
        return;
      }

      // 3. Transisi Iqomah -> Sholat
      if (displayState === 'IQOMAH') {
        setStateCountdownSeconds((prev: number) => {
          if (prev <= 1) {
            setDisplayState('PRAYER');
            return (data.prayerMode.durationMinutes || 12) * 60;
          }
          if (prev <= data.iqomah.beepLastSeconds) {
            audioService.playBeep(1150, 0.12, 'square', 0.4);
          }
          return prev - 1;
        });
        return;
      }

      // 4. Transisi Sholat -> Normal
      if (displayState === 'PRAYER') {
        setStateCountdownSeconds((prev: number) => {
          if (prev <= 1) {
            setDisplayState('NORMAL');
            setActivePrayerTarget(null);
            return 0;
          }
          return prev - 1;
        });
        return;
      }

      // 5. Pengecekan Masuk Waktu Tartil Otomatis (Pre-Adzan)
      const nextPrayerName = prayers.nextPrayer.name;
      const secondsLeft = prayers.timeRemainingSeconds;

      if (data.tartil.masterEnabled && displayState === 'NORMAL') {
        const prayerKey = nextPrayerName as keyof typeof data.tartil.prayers;
        const tartilConfig = data.tartil.prayers[prayerKey];

        if (tartilConfig && tartilConfig.enabled) {
          const tartilWindowSeconds = tartilConfig.minutesBefore * 60;
          if (secondsLeft <= tartilWindowSeconds && secondsLeft > 0) {
            setDisplayState('TARTIL');
            setActivePrayerTarget(nextPrayerName);
            setStateCountdownSeconds(secondsLeft);
            if (tartilConfig.audioUrl) {
              audioService.playTartil(tartilConfig.audioUrl, data.tartil.volume);
            }
          }
        }
      }

      // 6. Jika sedang Tartil, update sisa detik menuju adzan
      if (displayState === 'TARTIL') {
        setStateCountdownSeconds(secondsLeft);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [data, displayState, prayers, activePrayerTarget]);

  // Simulator Triggers yang Mem-broadcast ke Seluruh Tab/Window (TV Display) & Cloud
  const simulateTartil = useCallback((prayerName: PrayerName = 'maghrib', durationSeconds = 60) => {
    channelService.broadcast({
      type: 'SIMULATE_TARTIL',
      prayerName,
      durationSeconds,
    });
    if (supabaseService.isConfigured()) {
      supabaseService.sendRemoteCommand({ action: 'TARTIL', prayerName, durationSeconds });
    }
  }, []);

  const simulateAdzan = useCallback((prayerName: PrayerName = 'maghrib', durationSeconds = 45) => {
    channelService.broadcast({
      type: 'SIMULATE_ADZAN',
      prayerName,
      durationSeconds,
    });
    if (supabaseService.isConfigured()) {
      supabaseService.sendRemoteCommand({ action: 'ADZAN', prayerName, durationSeconds });
    }
  }, []);

  const simulateIqomah = useCallback((prayerName: PrayerName = 'maghrib', minutes = 2) => {
    channelService.broadcast({
      type: 'SIMULATE_IQOMAH',
      prayerName,
      durationSeconds: minutes * 60,
    });
    if (supabaseService.isConfigured()) {
      supabaseService.sendRemoteCommand({ action: 'IQOMAH', prayerName, durationSeconds: minutes * 60 });
    }
  }, []);

  const simulatePrayerMode = useCallback((minutes = 1) => {
    channelService.broadcast({
      type: 'SIMULATE_PRAYER',
      durationSeconds: minutes * 60,
    });
    if (supabaseService.isConfigured()) {
      supabaseService.sendRemoteCommand({ action: 'PRAYER_MODE', durationSeconds: minutes * 60 });
    }
  }, []);

  const resetToNormal = useCallback(() => {
    channelService.broadcast({
      type: 'RESET_NORMAL',
    });
    if (supabaseService.isConfigured()) {
      supabaseService.sendRemoteCommand({ action: 'RESET_NORMAL' });
    }
  }, []);

  return (
    <MosqueContext.Provider
      value={{
        data,
        updateData,
        resetData,
        currentTime,
        prayers,
        displayState,
        activePrayerTarget,
        stateCountdownSeconds,
        isAudioUnlocked,
        unlockAudio,
        simulateTartil,
        simulateAdzan,
        simulateIqomah,
        simulatePrayerMode,
        resetToNormal,
      }}
    >
      {children}
    </MosqueContext.Provider>
  );
};

export function useMosque(): MosqueContextType {
  const ctx = useContext(MosqueContext);
  if (!ctx) {
    throw new Error('useMosque must be used within MosqueProvider');
  }
  return ctx;
}
