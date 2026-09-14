# 🕌 Digital Signage TV Masjid & Auto-Tartil Terintegrasi

Sistem informasi digital masjid modern berbasis Web & Android STB yang menggantikan jam running text LED konvensional. Menampilkan jadwal sholat presisi, running text dinamis, media slider (poster kajian, laporan kas, petugas Jum'at, hadits), auto-tartil murottal pra-adzan, countdown iqomah, mode sholat redup, dan panel admin remote.

---

## 🚀 Fitur Utama

1. **Tampilan Display TV (16:9 Full HD Landscape)**:
   - **Jam Digital Real-time**: Waktu presisi dengan detik dan kalender Masehi & Hijriah otomatis (+/- hari koreksi hilal).
   - **Jadwal 6 Waktu Sholat**: Subuh, Terbit (Syuruq), Dzuhur, Ashar, Maghrib, Isya dihitung matematis secara offline menggunakan standar **Kemenag RI** (Subuh 20°, Isya 18°) + koreksi ihtiati (+/- menit).
   - **Kartu Sholat Interaktif**: Sholat berikutnya di-highlight dengan timer countdown mundur.
   - **Media Slider Carousel**: Poster kajian / kegiatan, laporan keuangan kas masjid, petugas sholat Jum'at, dan kutipan hadits harian.
   - **Running Text Marquee**: Teks berjalan halus dengan kategori Info, Infaq, dan Hadits.

2. **Siklus Ibadah Otomatis**:
   - **Mode Murottal Pra-Adzan (Auto-Tartil)**: Otomatis memutar murottal MP3 $N$ menit sebelum adzan tiba (dapat diatur per waktu sholat).
   - **Layar Masuk Adzan**: Membunyikan chime nada adzan otomatis dan menampilkan layar peringatan adzan masuk.
   - **Hitung Mundur Iqomah**: Angka countdown besar dengan audio beeper di detik-detik terakhir.
   - **Mode Sholat Berjamaah (Shaf Khusyuk)**: Layar meredup/gelap dengan himbauan meluruskan dan merapatkan shaf serta mematikan nada dering ponsel.

3. **Dashboard Pengurus DKM (Bisa Diakses dari HP / Laptop)**:
   - Manajemen profil masjid dan koordinat GPS (tersedia preset kota-kota besar di Indonesia).
   - Pengaturan durasi tartil, pilihan surat Al-Qur'an, dan jeda iqomah.
   - CRUD pesan running text.
   - Laporan keuangan kas masjid (otomatis menghitung saldo akhir).
   - Simulator & Remote Control: Uji coba instan siklus adzan, iqomah, tartil, dan tes audio speaker mixer.

4. **100% Offline-First**:
   - Jadwal sholat dihitung di perangkat (tidak bergantung koneksi internet setiap menit).
   - Beeper dan chime menggunakan Web Audio API murni.
   - Data otomatis tersimpan di `localStorage` STB.

---

## 💻 Cara Menjalankan Secara Lokal

```bash
# 1. Masuk ke direktori
cd "RT TV Masjid"

# 2. Install dependensi
npm install

# 3. Jalankan server pengembang
npm run dev
```

Buka di browser:
- **Tampilan TV**: [http://localhost:5173/](http://localhost:5173/)
- **Dashboard Admin**: [http://localhost:5173/?mode=admin](http://localhost:5173/?mode=admin)

---

## 📺 Panduan Pemasangan pada STB Android Bekas (ZTE B860H / HG680P / Smart TV)

### 1. Perangkat Keras (Hardware)
* **Kabel HDMI**: Colok dari STB ke TV LED Masjid (32" / 43" / 55").
* **Kabel Audio Jack 3.5mm ke RCA / Akai**: Colok dari port AV/Audio STB ke salah satu channel input pada mixer / amplifier sound system masjid.
* *(Opsional)* Jika timbul suara dengung (*ground hum*) pada speaker masjid, pasang alat kecil **Ground Loop Isolator** (sekitar Rp30.000) di antara kabel audio STB dan mixer.

### 2. Pengaturan Software di STB
1. Hubungkan STB ke jaringan Wi-Fi masjid.
2. Install aplikasi **Fully Kiosk Browser** (gratis di Play Store atau download file `.apk`-nya).
3. Buka pengaturan Fully Kiosk Browser:
   - **Start URL**: Masukkan link hosting TV Anda (misal: `https://masjid-anda.vercel.app/`).
   - Aktifkan **Autostart on Boot** (agar saat STB dicolok listrik, aplikasi langsung terbuka otomatis tanpa remote).
   - Aktifkan **Keep Screen On** (agar TV tidak masuk mode sleep/mati).
   - Aktifkan **Enable Web Audio / Autoplay** (agar auto-tartil bisa bersuara tanpa klik manual).

---

## 🌐 Cara Mengakses & Sinkronisasi Data dari Mana Saja (Vercel + Supabase)

Agar pengurus DKM bisa mengupdate teks, jadwal, dan banner dari HP di rumah atau mana saja (beda jaringan Wi-Fi/kuota):

### 1. Buat Database Cloud Gratis di Supabase
1. Buka [supabase.com](https://supabase.com) dan buat akun gratis (bisa login pakai Google/GitHub).
2. Klik **New Project** (beri nama misal: `masjid-tv`).
3. Setelah project selesai dibuat, buka menu **SQL Editor** di sebelah kiri.
4. Buat *New Query*, tempel kode SQL berikut, lalu klik **Run**:

```sql
-- Buat tabel konfigurasi TV Masjid
create table if not exists mosque_config (
  id text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Buka akses Anonim untuk aplikasi TV & HP
alter table mosque_config enable row level security;
create policy "Allow public read" on mosque_config for select using (true);
create policy "Allow public insert" on mosque_config for insert with check (true);
create policy "Allow public update" on mosque_config for update using (true);

-- Aktifkan Realtime WebSocket
alter publication supabase_realtime add table mosque_config;
```

5. Buka menu **Project Settings** (ikon gear di kiri bawah) > **API**.
6. Salin:
   - **Project URL** (contoh: `https://xyzabcdef.supabase.co`)
   - **Anon Public API Key**

### 2. Hubungkan ke Aplikasi
* Buka **Dashboard Admin** di browser (`/?mode=admin`) > buka tab **Cloud Sync (HP ↔ TV)**.
* Masukkan **Project URL** dan **Anon Key**, lalu klik **Uji Koneksi Cloud** dan **Simpan Konfigurasi**.
* Klik **Unggah ke Cloud** untuk mengirim data awal masjid ke database online.

### 3. Deploy Gratis ke Vercel
1. Upload project ini ke **GitHub**.
2. Buka [vercel.com](https://vercel.com) > klik **Add New...** > **Project** > pilih repo ini.
3. *(Opsional)* Di bagian **Environment Variables**, Anda bisa menambahkan:
   - `VITE_SUPABASE_URL` = (URL Supabase Anda)
   - `VITE_SUPABASE_ANON_KEY` = (Anon Key Supabase Anda)
4. Klik **Deploy**!
5. Anda akan mendapatkan link publik, misal: `https://masjid-anda.vercel.app`.
   - Buka di TV Masjid: `https://masjid-anda.vercel.app/`
   - Buka di HP Pengurus: `https://masjid-anda.vercel.app/?mode=admin`
6. **Selesai!** Kapan pun pengurus menyimpan teks atau menekan tombol di HP, layar TV di masjid langsung otomatis berubah seketika (*real-time*)!

