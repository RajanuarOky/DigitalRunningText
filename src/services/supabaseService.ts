import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { SystemData, PrayerName } from '../types';

export interface SupabaseConfig {
  enabled: boolean;
  url: string;
  anonKey: string;
  syncId: string;
}

const SUPABASE_CONFIG_KEY = 'rt_tv_supabase_settings_v1';
const envUrl = (import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_URL || 'https://iwtrmzbqldpzxjsiolpu.supabase.co';
const envKey = (import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_ANON_KEY || '';

export const DEFAULT_SUPABASE_CONFIG: SupabaseConfig = {
  enabled: Boolean(envUrl && envKey),
  url: envUrl,
  anonKey: envKey,
  syncId: 'default',
};

class SupabaseService {
  private client: SupabaseClient | null = null;
  private config: SupabaseConfig = DEFAULT_SUPABASE_CONFIG;
  private activeChannel: ReturnType<SupabaseClient['channel']> | null = null;

  constructor() {
    this.loadConfig();
    this.initClient();
  }

  public loadConfig(): SupabaseConfig {
    try {
      const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const url = parsed.url || DEFAULT_SUPABASE_CONFIG.url;
        const anonKey = parsed.anonKey || DEFAULT_SUPABASE_CONFIG.anonKey;
        // Otomatis aktif jika URL dan Anon Key tersedia
        const isEnabled = (url && anonKey) ? (parsed.enabled !== false) : false;
        this.config = {
          ...DEFAULT_SUPABASE_CONFIG,
          ...parsed,
          url,
          anonKey,
          enabled: isEnabled,
        };
      } else {
        const hasKeys = Boolean(DEFAULT_SUPABASE_CONFIG.url && DEFAULT_SUPABASE_CONFIG.anonKey);
        this.config = {
          ...DEFAULT_SUPABASE_CONFIG,
          enabled: hasKeys,
        };
      }
    } catch {
      this.config = DEFAULT_SUPABASE_CONFIG;
    }
    return this.config;
  }

  public saveConfig(newConfig: SupabaseConfig) {
    this.config = newConfig;
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(newConfig));
    this.initClient();
  }

  private initClient() {
    if (this.activeChannel) {
      this.activeChannel.unsubscribe();
      this.activeChannel = null;
    }

    if (this.config.url && this.config.anonKey) {
      this.config.enabled = true; // Auto-enable if credentials are provided
      try {
        this.client = createClient(this.config.url, this.config.anonKey, {
          auth: { persistSession: false },
          realtime: {
            params: {
              eventsPerSecond: 10,
            },
          },
        });
      } catch (e) {
        console.error('Gagal inisialisasi Supabase client:', e);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  public isConfigured(): boolean {
    if (!this.client && this.config.url && this.config.anonKey) {
      this.initClient();
    }
    return !!(this.config.url && this.config.anonKey && this.client);
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.client) {
      return { success: false, message: 'URL atau Anon Key Supabase belum diisi lengkap.' };
    }

    try {
      const { error } = await this.client
        .from('mosque_config')
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          return {
            success: false,
            message: 'Koneksi berhasil terhubung, namun tabel "mosque_config" belum dibuat di database Supabase Anda. Silakan jalankan script SQL di bawah.',
          };
        }
        return { success: false, message: `Error dari Supabase: ${error.message}` };
      }

      return { success: true, message: 'Koneksi ke database Cloud Supabase Berhasil dan Aktif!' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Gagal terhubung ke Supabase: ${msg}` };
    }
  }

  /**
   * Mengambil data masjid terbaru dari Cloud Supabase
   */
  public async fetchCloudData(): Promise<SystemData | null> {
    if (!this.client || !this.isConfigured()) return null;

    try {
      const { data, error } = await this.client
        .from('mosque_config')
        .select('data')
        .eq('id', this.config.syncId || 'default')
        .maybeSingle();

      if (error || !data) {
        return null;
      }
      return data.data as SystemData;
    } catch (e) {
      console.warn('Gagal fetch data dari Cloud:', e);
      return null;
    }
  }

  /**
   * Menyimpan data masjid ke Cloud Supabase (bisa dipanggil dari HP / Laptop)
   */
  public async pushCloudData(data: SystemData): Promise<boolean> {
    if (!this.client || !this.isConfigured()) return false;

    try {
      const syncId = this.config.syncId || 'default';
      const { error } = await this.client.from('mosque_config').upsert(
        {
          id: syncId,
          data: data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (error) {
        console.error('Gagal simpan data ke Supabase:', error);
        return false;
      }

      // Kirim juga broadcast realtime instan
      if (this.activeChannel) {
        this.activeChannel.send({
          type: 'broadcast',
          event: 'DATA_SYNCED',
          payload: data,
        });
      }

      return true;
    } catch (e) {
      console.error('Error pushing data to Supabase:', e);
      return false;
    }
  }

  /**
   * Mengirim perintah remote instan ke TV Masjid via Realtime Broadcast
   */
  public async sendRemoteCommand(
    command:
      | { action: 'ADZAN'; prayerName: PrayerName; durationSeconds: number }
      | { action: 'TARTIL'; prayerName: PrayerName; durationSeconds: number }
      | { action: 'IQOMAH'; prayerName: PrayerName; durationSeconds: number }
      | { action: 'PRAYER_MODE'; durationSeconds: number }
      | { action: 'RESET_NORMAL' }
  ) {
    if (!this.client || !this.isConfigured() || !this.activeChannel) return;

    try {
      await this.activeChannel.send({
        type: 'broadcast',
        event: 'REMOTE_COMMAND',
        payload: command,
      });
    } catch (e) {
      console.warn('Gagal mengirim broadcast command:', e);
    }
  }

  /**
   * Berlangganan sinkronisasi realtime pada TV STB
   */
  public subscribeRealtime(
    onDataUpdated: (newData: SystemData) => void,
    onCommandReceived?: (cmd: { action: string; prayerName?: PrayerName; durationSeconds?: number }) => void
  ) {
    if (!this.client || !this.isConfigured()) return;

    const channelName = `mosque_tv_channel_${this.config.syncId || 'default'}`;

    if (this.activeChannel) {
      this.activeChannel.unsubscribe();
    }

    this.activeChannel = this.client.channel(channelName);

    // 1. Dengar perubahan di Database (Postgres Changes)
    this.activeChannel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mosque_config',
          filter: `id=eq.${this.config.syncId || 'default'}`,
        },
        (payload) => {
          if (payload.new && (payload.new as { data: SystemData }).data) {
            onDataUpdated((payload.new as { data: SystemData }).data);
          }
        }
      )
      // 2. Dengar broadcast data instan
      .on('broadcast', { event: 'DATA_SYNCED' }, (payload) => {
        if (payload.payload) {
          onDataUpdated(payload.payload as SystemData);
        }
      })
      // 3. Dengar broadcast remote simulator
      .on('broadcast', { event: 'REMOTE_COMMAND' }, (payload) => {
        if (onCommandReceived && payload.payload) {
          onCommandReceived(payload.payload as { action: string; prayerName?: PrayerName; durationSeconds?: number });
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Berhasil terhubung ke Supabase Realtime Channel:', channelName);
        }
      });
  }
}

export const supabaseService = new SupabaseService();
