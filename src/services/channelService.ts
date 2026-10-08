import type { PrayerName, SystemData } from '../types';

export type ChannelMessage =
  | { type: 'SIMULATE_ADZAN'; prayerName: PrayerName; durationSeconds: number }
  | { type: 'SIMULATE_TARTIL'; prayerName: PrayerName; durationSeconds: number }
  | { type: 'SIMULATE_IQOMAH'; prayerName: PrayerName; durationSeconds: number }
  | { type: 'SIMULATE_PRAYER'; durationSeconds: number }
  | { type: 'RESET_NORMAL' }
  | { type: 'SYNC_DATA'; data: SystemData }
  | { type: 'TEST_SOUND'; sound: 'beep' | 'chime' | 'iqomah' };

const BASE_CHANNEL_NAME = 'rt_tv_masjid_sync_channel';
const BASE_STORAGE_KEY = 'rt_tv_masjid_sync_event';

class ChannelService {
  private channel: BroadcastChannel | null = null;
  private listeners: ((msg: ChannelMessage) => void)[] = [];
  private mosqueId = 'default';
  private storageHandler: ((e: StorageEvent) => void) | null = null;

  constructor() {
    this.initChannel();
  }

  public setMosqueId(id: string) {
    if (this.mosqueId === id && this.channel) return;
    this.mosqueId = id || 'default';
    this.initChannel();
  }

  private initChannel() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    const channelName = `${BASE_CHANNEL_NAME}_${this.mosqueId}`;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(channelName);
        this.channel.onmessage = (event) => {
          this.notifyListeners(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel not available, using storage fallback:', e);
      }
    }

    if (typeof window !== 'undefined') {
      if (this.storageHandler) {
        window.removeEventListener('storage', this.storageHandler);
      }
      const storageKey = `${BASE_STORAGE_KEY}_${this.mosqueId}`;
      this.storageHandler = (e: StorageEvent) => {
        if (e.key === storageKey && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed && parsed.payload) {
              this.notifyListeners(parsed.payload);
            }
          } catch (err) {
            console.warn('Failed to parse storage event:', err);
          }
        }
      };
      window.addEventListener('storage', this.storageHandler);
    }
  }

  public subscribe(callback: (msg: ChannelMessage) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(msg: ChannelMessage) {
    this.listeners.forEach((l) => {
      try {
        l(msg);
      } catch (e) {
        console.error('Error in channel listener:', e);
      }
    });
  }

  public broadcast(msg: ChannelMessage) {
    // 1. Notify local listeners in same tab
    this.notifyListeners(msg);

    // 2. Broadcast to other tabs via BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (e) {
        console.warn('BroadcastChannel postMessage failed:', e);
      }
    }

    // 3. Broadcast to other tabs via localStorage event
    try {
      const storageKey = `${BASE_STORAGE_KEY}_${this.mosqueId}`;
      localStorage.setItem(
        storageKey,
        JSON.stringify({ payload: msg, timestamp: Date.now() })
      );
    } catch {
      // ignore
    }
  }
}

export const channelService = new ChannelService();

