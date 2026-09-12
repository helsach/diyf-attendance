# DIYF Attendance — Event Registration & QR Attendance System

Sistem manajemen presensi acara modern berbasis web untuk registrasi tiket undangan, pendaftaran cepat tamu walk-in di lokasi (*on-site*), dan pemindaian QR code secara *real-time*.

---

## Fitur Utama

- **Live QR Scanner**: Pemindai tiket langsung menggunakan kamera perangkat dengan verifikasi instan dan indikator audio.
- **Fast-track Walk-In**: Registrasi cepat untuk tamu umum langsung dari meja panitia tanpa persiapan awal.
- **Digital E-Pass / Invitation**: Halaman tiket tamu personal berdesain *boarding pass* dilengkapi QR code dinamis dan opsi simpan gambar ke galeri.
- **Real-time Synchronization**: Pembaruan status presensi terhubung langsung ke database Supabase secara instan.
- **Modern UI**: Antarmuka bersih bergaya *glassmorphism* berbasis Tailwind CSS.

---

## Tech Stack

- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS, Lucide React Icons
- **Backend & Database**: Supabase (PostgreSQL & Realtime Channels)
- **Scanner Core**: `html5-qrcode`
- **QR Generator**: `qrcode.react`

---

## 🚀 Memulai (Local Development)

### 1. Clone Repository
```bash
git clone (https://github.com/helsach/diyf-attendance.git)
cd event-reg