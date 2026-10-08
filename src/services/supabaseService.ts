import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { SystemData, PrayerName, MosqueListItem } from '../types';
import { DEFAULT_DATA } from './storageService';

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
      // 1. Cek apakah ada kredensial / kode masjid yang dipassing via URL parameters
      // Contoh: ?masjid=al-ikhlas atau ?id=al-ikhlas atau ?sync_id=al-ikhlas
      let urlParamSyncId: string | null = null;
      if (typeof window !== 'undefined' && window.location) {
        const urlParams = new URLSearchParams(window.location.search);
        const urlParamUrl = urlParams.get('supabase_url') || urlParams.get('url');
        const urlParamKey = urlParams.get('supabase_key') || urlParams.get('anon_key') || urlParams.get('key');
        urlParamSyncId = urlParams.get('masjid') || urlParams.get('sync_id') || urlParams.get('syncId') || urlParams.get('id');

        if (urlParamKey) {
          const configFromUrl: SupabaseConfig = {
            url: urlParamUrl || DEFAULT_SUPABASE_CONFIG.url,
            anonKey: urlParamKey,
            syncId: urlParamSyncId || 'default',
            enabled: true,
          };
          localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(configFromUrl));
          this.config = configFromUrl;
          return this.config;
        }
      }

      const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const url = parsed.url || DEFAULT_SUPABASE_CONFIG.url;
        const anonKey = parsed.anonKey || DEFAULT_SUPABASE_CONFIG.anonKey;
        // Selalu aktif otomatis selama URL dan Anon Key terisi
        const isEnabled = Boolean(url && anonKey);
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

      if (urlParamSyncId) {
        this.config.syncId = urlParamSyncId;
      }
    } catch {
      this.config = DEFAULT_SUPABASE_CONFIG;
    }
    return this.config;
  }

  public setSyncId(syncId: string) {
    this.config = {
      ...this.config,
      syncId: syncId || 'default',
    };
    if (this.activeChannel) {
      this.initClient();
    }
  }

  public getSyncId(): string {
    return this.config.syncId || 'default';
  }

  public saveConfig(newConfig: SupabaseConfig) {
    this.config = {
      ...newConfig,
      enabled: Boolean(newConfig.url && newConfig.anonKey),
    };
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(this.config));
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
  public async fetchCloudData(syncIdOverride?: string): Promise<SystemData | null> {
    if (!this.client || !this.isConfigured()) return null;

    const targetId = syncIdOverride || this.config.syncId || 'default';
    try {
      const { data, error } = await this.client
        .from('mosque_config')
        .select('data')
        .eq('id', targetId)
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
  public async pushCloudData(data: SystemData, syncIdOverride?: string): Promise<boolean> {
    if (!this.client || !this.isConfigured()) return false;

    const syncId = syncIdOverride || this.config.syncId || 'default';
    try {
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

      // Kirim juga broadcast realtime instan ke channel masjid terkait
      const channelName = `mosque_tv_channel_${syncId}`;
      let channel = this.activeChannel;
      if (!channel || channel.topic !== `realtime:${channelName}`) {
        channel = this.client.channel(channelName);
      }
      channel.send({
        type: 'broadcast',
        event: 'DATA_SYNCED',
        payload: data,
      });

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
      | { action: 'TEST_SOUND'; sound: 'beep' | 'chime' | 'iqomah' },
    syncIdOverride?: string
  ) {
    if (!this.client || !this.isConfigured()) return;

    const syncId = syncIdOverride || this.config.syncId || 'default';
    const channelName = `mosque_tv_channel_${syncId}`;

    try {
      if (!this.activeChannel || this.activeChannel.topic !== `realtime:${channelName}`) {
        this.activeChannel = this.client.channel(channelName);
      }

      // Pastikan channel tersubscribe
      const channel = this.activeChannel;
      if (channel.state !== 'joined' && channel.state !== 'joining') {
        channel.subscribe();
      }

      await channel.send({
        type: 'broadcast',
        event: 'REMOTE_COMMAND',
        payload: command,
      });
      console.log(`📡 [Supabase Broadcast (${channelName})] Remote command sent:`, command);
    } catch (e) {
      console.warn('Gagal mengirim broadcast command:', e);
    }
  }

  /**
   * Berlangganan sinkronisasi realtime pada TV STB
   */
  public subscribeRealtime(
    onDataUpdated: (newData: SystemData) => void,
    onCommandReceived?: (cmd: { action: string; prayerName?: PrayerName; durationSeconds?: number; sound?: 'beep' | 'chime' | 'iqomah' }) => void,
    syncIdOverride?: string
  ) {
    if (!this.client || !this.isConfigured()) return;

    const syncId = syncIdOverride || this.config.syncId || 'default';
    const channelName = `mosque_tv_channel_${syncId}`;

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
          filter: `id=eq.${syncId}`,
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
          onCommandReceived(payload.payload as { action: string; prayerName?: PrayerName; durationSeconds?: number; sound?: 'beep' | 'chime' | 'iqomah' });
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Berhasil terhubung ke Supabase Realtime Channel:', channelName);
        }
      });
  }

  /**
   * Super Admin: Mendapatkan daftar semua masjid yang terdaftar di Supabase
   */
  public async getAllMosques(): Promise<MosqueListItem[]> {
    if (!this.client || !this.isConfigured()) return [];

    try {
      const { data, error } = await this.client
        .from('mosque_config')
        .select('id, data, updated_at')
        .order('updated_at', { ascending: false });

      if (error || !data) {
        console.error('Gagal mengambil daftar masjid:', error);
        return [];
      }

      return data.map((row: { id: string; data: Partial<SystemData>; updated_at?: string }) => {
        const sysData = row.data as SystemData | undefined;
        return {
          id: row.id,
          name: sysData?.mosque?.name || `Masjid (${row.id})`,
          city: sysData?.mosque?.city || 'Default',
          adminPin: sysData?.mosque?.adminPin || '1234',
          updatedAt: row.updated_at,
        };
      });
    } catch (e) {
      console.error('Error getAllMosques:', e);
      return [];
    }
  }

  /**
   * Super Admin: Menambahkan masjid baru dengan template default
   */
  public async createMosque(
    id: string,
    name: string,
    city: string,
    adminPin = '1234'
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.client || !this.isConfigured()) {
      return { success: false, error: 'Supabase belum terhubung.' };
    }

    try {
      const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      if (!cleanId) {
        return { success: false, error: 'ID masjid tidak valid.' };
      }

      // Pastikan belum ada ID yang sama
      const { data: existing } = await this.client
        .from('mosque_config')
        .select('id')
        .eq('id', cleanId)
        .maybeSingle();

      if (existing) {
        return { success: false, error: `Masjid dengan ID "${cleanId}" sudah ada.` };
      }

      // Klon template data
      const newMosqueData: SystemData = JSON.parse(JSON.stringify(DEFAULT_DATA));
      newMosqueData.mosque.name = name;
      newMosqueData.mosque.city = city;
      newMosqueData.mosque.adminPin = adminPin;

      const { error: insertError } = await this.client.from('mosque_config').insert({
        id: cleanId,
        data: newMosqueData,
        updated_at: new Date().toISOString(),
      });

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      return { success: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: msg };
    }
  }

  /**
   * Super Admin: Menghapus masjid dari Supabase
   */
  public async deleteMosque(id: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client || !this.isConfigured()) {
      return { success: false, error: 'Supabase belum terhubung.' };
    }

    if (id === 'default') {
      return { success: false, error: 'Masjid template "default" tidak dapat dihapus.' };
    }

    try {
      const { error } = await this.client
        .from('mosque_config')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: msg };
    }
  }


  /**
   * Upload file MP3 Murottal / Adzan ke Supabase Storage (Bucket: 'murottal')
   */
  public async uploadAudioFile(
    file: File,
    folder = 'murottal'
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    if (!this.client || !this.isConfigured()) {
      return {
        success: false,
        error: 'Cloud Supabase belum terhubung. Silakan atur URL & Key di tab "Cloud Sync" terlebih dahulu.',
      };
    }

    try {
      // Bersihkan nama file agar aman URL (hanya alfanumerik, titik, strip, underscore)
      const cleanName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9.]/g, '_')
        .replace(/_+/g, '_');
      const fileName = `${Date.now()}_${cleanName}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await this.client.storage
        .from('murottal')
        .upload(filePath, file, {
          cacheControl: '31536000',
          upsert: true,
        });

      if (uploadError) {
        console.error('Supabase storage upload error:', uploadError);
        if (
          uploadError.message?.includes('Bucket not found') ||
          (uploadError as unknown as { statusCode?: number }).statusCode === 404
        ) {
          return {
            success: false,
            error:
              'Bucket storage "murottal" belum dibuat di Supabase Anda. Silakan jalankan script SQL di tab "Cloud Sync" atau buat bucket publik bernama "murottal" di menu Storage Supabase.',
          };
        }
        return { success: false, error: uploadError.message };
      }

      const { data } = this.client.storage
        .from('murottal')
        .getPublicUrl(filePath);

      return { success: true, url: data.publicUrl };
    } catch (err: unknown) {
      console.error('Upload exception:', err);
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengunggah file.';
      return { success: false, error: msg };
    }
  }
}

export const supabaseService = new SupabaseService();
