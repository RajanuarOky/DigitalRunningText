import type { PrayerName, SystemData } from '../types';

export type ChannelMessage =
  | { type: 'SIMULATE_ADZAN'; prayerName: PrayerName; durationSeconds: number }
  | { type: 'SIMULATE_TARTIL'; prayerName: PrayerName; durationSeconds: number }
  | { type: 'SIMULATE_IQOMAH'; prayerName: PrayerName; durationSeconds: number }
  | { type: 'SIMULATE_PRAYER'; durationSeconds: number }
  | { type: 'RESET_NORMAL' }
  | { type: 'SYNC_DATA'; data: SystemData }
  | { type: 'TEST_SOUND'; sound: 'beep' | 'chime' | 'iqomah' };

const CHANNEL_NAME = 'rt_tv_masjid_sync_channel';
const STORAGE_EVENT_KEY = 'rt_tv_masjid_sync_event';

class ChannelService {
  private channel: BroadcastChannel | null = null;
  private listeners: ((msg: ChannelMessage) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          this.notifyListeners(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel not available, using storage fallback:', e);
      }
    }

    // Fallback via window storage event (multi-tab support across all browsers)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_EVENT_KEY && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed && parsed.payload) {
              this.notifyListeners(parsed.payload);
            }
          } catch (err) {
            console.warn('Failed to parse storage event:', err);
          }
        }
      });
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
      localStorage.setItem(
        STORAGE_EVENT_KEY,
        JSON.stringify({ payload: msg, timestamp: Date.now() })
      );
    } catch {
      // ignore
    }
  }
}

export const channelService = new ChannelService();
