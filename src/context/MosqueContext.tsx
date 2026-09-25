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
  testSound: (sound: 'beep' | 'chime' | 'iqomah') => void;
}

const MosqueContext = createContext<MosqueContextType | undefined>(undefined);

export const MosqueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<SystemData>(() => storageService.loadData());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [displayState, setDisplayState] = useState<AppDisplayState>('NORMAL');
  const [activePrayerTarget, setActivePrayerTarget] = useState<PrayerName | null>(null);
  const [stateCountdownSeconds, setStateCountdownSeconds] = useState<number>(0);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(false);
  const simulationRef = useRef<{
    phase: 'ADZAN' | 'IQOMAH' | 'PRAYER' | 'TARTIL';
    prayerName: PrayerName;
    endTimeMs: number;
  } | null>(null);
  const lastStateRef = useRef<AppDisplayState>('NORMAL');
  const lastAdzanChimeTriggeredRef = useRef<string | null>(null);

  // Keep fresh references for callbacks and timers without causing re-subscriptions
  const dataRef = useRef<SystemData>(data);
  const displayStateRef = useRef<AppDisplayState>(displayState);
  const activePrayerTargetRef = useRef<PrayerName | null>(activePrayerTarget);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    displayStateRef.current = displayState;
  }, [displayState]);

  useEffect(() => {
    activePrayerTargetRef.current = activePrayerTarget;
  }, [activePrayerTarget]);

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
    simulationRef.current = {
      phase: 'ADZAN',
      prayerName,
      endTimeMs: Date.now() + duration * 1000,
    };
    audioService.stopTartil();
    audioService.playAdzanChime();
    setDisplayState('ADZAN');
    setActivePrayerTarget(prayerName);
    setStateCountdownSeconds(duration);
  }, []);

  const applyLocalSimulateTartil = useCallback((prayerName: PrayerName = 'maghrib', duration = 60) => {
    simulationRef.current = {
      phase: 'TARTIL',
      prayerName,
      endTimeMs: Date.now() + duration * 1000,
    };
    setDisplayState('TARTIL');
    setActivePrayerTarget(prayerName);
    setStateCountdownSeconds(duration);
    const tartilCfg = dataRef.current.tartil.prayers[prayerName as keyof typeof dataRef.current.tartil.prayers];
    if (tartilCfg && tartilCfg.audioUrl) {
      audioService.playTartil(tartilCfg.audioUrl, dataRef.current.tartil.volume);
    }
  }, []);

  const applyLocalSimulateIqomah = useCallback((prayerName: PrayerName = 'maghrib', durationSeconds = 120) => {
    simulationRef.current = {
      phase: 'IQOMAH',
      prayerName,
      endTimeMs: Date.now() + durationSeconds * 1000,
    };
    audioService.stopTartil();
    setDisplayState('IQOMAH');
    setActivePrayerTarget(prayerName);
    setStateCountdownSeconds(durationSeconds);
  }, []);

  const applyLocalSimulatePrayerMode = useCallback((durationSeconds = 60) => {
    simulationRef.current = {
      phase: 'PRAYER',
      prayerName: 'maghrib',
      endTimeMs: Date.now() + durationSeconds * 1000,
    };
    audioService.stopTartil();
    setDisplayState('PRAYER');
    setStateCountdownSeconds(durationSeconds);
  }, []);

  const applyLocalReset = useCallback(() => {
    simulationRef.current = null;
    audioService.stopTartil();
    setDisplayState('NORMAL');
    setActivePrayerTarget(null);
    setStateCountdownSeconds(0);
  }, []);

  const applyLocalTestSound = useCallback((sound: 'beep' | 'chime' | 'iqomah') => {
    if (sound === 'beep') audioService.playBeep(880, 0.3, 'sine');
    if (sound === 'chime') audioService.playAdzanChime();
    if (sound === 'iqomah') audioService.playIqomahAlert();
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
        case 'TEST_SOUND':
          applyLocalTestSound(msg.sound);
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
          if (cmd.action === 'TEST_SOUND' && cmd.sound) applyLocalTestSound(cmd.sound);
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
    applyLocalTestSound,
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

  // 1. Rock-solid 1-second clock tick + Instant Wakeup on Tab Visibility / Focus
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const onWakeup = () => {
      setCurrentTime(new Date());
    };

    document.addEventListener('visibilitychange', onWakeup);
    window.addEventListener('focus', onWakeup);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onWakeup);
      window.removeEventListener('focus', onWakeup);
    };
  }, []);

  // 2. State transition & countdown calculation (strictly timestamp-driven & immune to throttling)
  useEffect(() => {
    const currentData = dataRef.current;
    const nowMs = currentTime.getTime();

    // A. Mode Simulasi Manual (User testing via Admin / Remote)
    if (simulationRef.current) {
      const sim = simulationRef.current;
      const remainingSec = Math.max(0, Math.ceil((sim.endTimeMs - nowMs) / 1000));

      if (remainingSec <= 0) {
        if (sim.phase === 'ADZAN') {
          sim.phase = 'IQOMAH';
          sim.endTimeMs = nowMs + 60 * 1000;
          setDisplayState('IQOMAH');
          setStateCountdownSeconds(60);
          return;
        } else if (sim.phase === 'IQOMAH') {
          sim.phase = 'PRAYER';
          sim.endTimeMs = nowMs + 45 * 1000;
          setDisplayState('PRAYER');
          setStateCountdownSeconds(45);
          return;
        } else {
          simulationRef.current = null;
          audioService.stopTartil();
          setDisplayState('NORMAL');
          setActivePrayerTarget(null);
          setStateCountdownSeconds(0);
          return;
        }
      }

      setDisplayState(sim.phase);
      setActivePrayerTarget(sim.prayerName);
      setStateCountdownSeconds(remainingSec);

      if (sim.phase === 'IQOMAH' && remainingSec <= 10 && remainingSec > 0) {
        audioService.playBeep(1050, 0.1, 'sine', 0.4);
      }
      return;
    }

    // B. Mode Nyata (Real-time prayer scheduling berbasis timestamp dinding)
    const fardhuPrayers: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    let matchedPrayerCycle: {
      prayerName: PrayerName;
      phase: 'ADZAN' | 'IQOMAH' | 'PRAYER';
      remainingSec: number;
    } | null = null;

    for (const p of prayers.prayerSchedule) {
      if (!fardhuPrayers.includes(p.name)) continue;

      const pTimeMs = p.time.getTime();
      const diffSec = Math.floor((nowMs - pTimeMs) / 1000);

      const adzanDuration = 90; // 90 detik durasi adzan
      const iqomahMin = (currentData.iqomah.durations[p.name as keyof typeof currentData.iqomah.durations]) || 8;
      const iqomahDuration = iqomahMin * 60;
      const prayerDuration = (currentData.prayerMode.durationMinutes || 12) * 60;
      const totalCycleSec = adzanDuration + iqomahDuration + prayerDuration;

      // Cek apakah waktu saat ini berada dalam rentang siklus sholat fardhu ini
      if (diffSec >= 0 && diffSec < totalCycleSec) {
        if (diffSec < adzanDuration) {
          matchedPrayerCycle = {
            prayerName: p.name,
            phase: 'ADZAN',
            remainingSec: adzanDuration - diffSec,
          };
        } else if (diffSec < adzanDuration + iqomahDuration) {
          matchedPrayerCycle = {
            prayerName: p.name,
            phase: 'IQOMAH',
            remainingSec: (adzanDuration + iqomahDuration) - diffSec,
          };
        } else {
          matchedPrayerCycle = {
            prayerName: p.name,
            phase: 'PRAYER',
            remainingSec: totalCycleSec - diffSec,
          };
        }
        break;
      }
    }

    // 1. Jika sedang berada dalam fase Adzan, Iqomah, atau Sholat
    if (matchedPrayerCycle) {
      const { prayerName, phase, remainingSec } = matchedPrayerCycle;

      if (phase === 'ADZAN') {
        const adzanEventKey = `${prayerName}-${currentTime.toDateString()}`;
        if (lastStateRef.current !== 'ADZAN' || lastAdzanChimeTriggeredRef.current !== adzanEventKey) {
          audioService.stopTartil();
          audioService.playAdzanChime();
          lastAdzanChimeTriggeredRef.current = adzanEventKey;
        }
      } else if (phase === 'IQOMAH') {
        if (remainingSec <= currentData.iqomah.beepLastSeconds && remainingSec > 0) {
          audioService.playBeep(1150, 0.12, 'square', 0.4);
        }
      } else if (phase === 'PRAYER') {
        if (lastStateRef.current !== 'PRAYER') {
          audioService.stopTartil();
        }
      }

      lastStateRef.current = phase;
      setDisplayState(phase);
      setActivePrayerTarget(prayerName);
      setStateCountdownSeconds(remainingSec);
      return;
    }

    // 2. Cek Masa Murottal Tartil Pra-Adzan
    const nextPrayerName = prayers.nextPrayer.name;
    const secondsUntilNext = prayers.timeRemainingSeconds;

    if (currentData.tartil.masterEnabled) {
      const prayerKey = nextPrayerName as keyof typeof currentData.tartil.prayers;
      const tartilConfig = currentData.tartil.prayers[prayerKey];

      if (tartilConfig && tartilConfig.enabled) {
        const tartilWindowSec = tartilConfig.minutesBefore * 60;
        if (secondsUntilNext <= tartilWindowSec && secondsUntilNext > 0) {
          if (lastStateRef.current !== 'TARTIL' && tartilConfig.audioUrl) {
            const elapsed = Math.max(0, tartilWindowSec - secondsUntilNext);
            audioService.playTartil(tartilConfig.audioUrl, currentData.tartil.volume, elapsed);
          }
          lastStateRef.current = 'TARTIL';
          setDisplayState('TARTIL');
          setActivePrayerTarget(nextPrayerName);
          setStateCountdownSeconds(secondsUntilNext);
          return;
        }
      }
    }

    // 3. Mode Normal (Tidak ada siklus sholat aktif maupun tartil)
    if (lastStateRef.current === 'TARTIL') {
      audioService.stopTartil();
    }
    lastStateRef.current = 'NORMAL';
    setDisplayState('NORMAL');
    setActivePrayerTarget(null);
    setStateCountdownSeconds(0);
  }, [currentTime, prayers]);

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

  const testSound = useCallback((sound: 'beep' | 'chime' | 'iqomah') => {
    applyLocalTestSound(sound);
    channelService.broadcast({
      type: 'TEST_SOUND',
      sound,
    });
    if (supabaseService.isConfigured()) {
      supabaseService.sendRemoteCommand({ action: 'TEST_SOUND', sound });
    }
  }, [applyLocalTestSound]);

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
        testSound,
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
