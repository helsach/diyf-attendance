import { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../supabase';
import { 
  QrCode, 
  UserPlus, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Search, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';

export default function AdminScanner() {
  const [stats, setStats] = useState({ undanganHadir: 0, totalUndangan: 0, guestHadir: 0 });
  const [activeTab, setActiveTab] = useState('scanner');
  
  const [guestName, setGuestName] = useState('');
  const [invName, setInvName] = useState('');
  const [invCode, setInvCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [modalData, setModalData] = useState(null);
  const [recentAttendees, setRecentAttendees] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');

  const playTone = (freq, duration) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio context not allowed yet:", e);
    }
  };

  const loadData = async () => {
    const { data } = await supabase
      .from('attendees')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      const uHadir = data.filter(d => d.category === 'undangan' && d.is_checked_in).length;
      const uTotal = data.filter(d => d.category === 'undangan').length;
      const gHadir = data.filter(d => d.category === 'guest' && d.is_checked_in).length;
      setStats({ undanganHadir: uHadir, totalUndangan: uTotal, guestHadir: gHadir });
      setRecentAttendees(data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Inisialisasi scanner video langsung tanpa UI default library
  useEffect(() => {
    if (activeTab !== 'scanner') return;

    let html5QrCode = null;
    let isRunning = false;

    const onScanSuccess = async (decodedText) => {
      const code = decodedText.trim();
      
      const { data, error } = await supabase
        .from('attendees')
        .select('*')
        .eq('ticket_code', code)
        .single();

      if (error || !data) {
        playTone(280, 0.3);
        setModalData({
          type: 'error',
          title: 'QR Tidak Terdaftar',
          desc: `Kode "${code}" tidak ditemukan pada database.`
        });
        return;
      }

      if (data.is_checked_in) {
        playTone(420, 0.35);
        setModalData({
          type: 'warning',
          title: 'Sudah Check-In!',
          desc: `${data.name} sebelumnya sudah dinyatakan hadir.`,
          detail: data
        });
        return;
      }

      const now = new Date().toISOString();
      await supabase
        .from('attendees')
        .update({ is_checked_in: true, checked_in_at: now })
        .eq('id', data.id);

      playTone(920, 0.2);
      setModalData({
        type: 'success',
        title: 'Presensi Sukses!',
        desc: `Selamat datang, ${data.name}!`,
        detail: { ...data, checked_in_at: now }
      });
      loadData();
    };

    const startCamera = async () => {
      try {
        html5QrCode = new Html5Qrcode('reader');
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 240, height: 240 }
          },
          onScanSuccess,
          () => {}
        );
        isRunning = true;
      } catch (err) {
        console.error('Gagal mengakses sensor kamera:', err);
      }
    };

    const timer = setTimeout(startCamera, 120);

    return () => {
      clearTimeout(timer);
      if (html5QrCode && isRunning) {
        html5QrCode
          .stop()
          .then(() => html5QrCode.clear())
          .catch((e) => console.warn('Error cleanup camera:', e));
      }
    };
  }, [activeTab]);

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    setIsSubmitting(true);
    const guestCode = `GST-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const now = new Date().toISOString();

    const { error } = await supabase.from('attendees').insert([{
      ticket_code: guestCode,
      name: guestName.trim(),
      category: 'guest',
      is_checked_in: true,
      checked_in_at: now
    }]);

    if (!error) {
      playTone(920, 0.15);
      setModalData({
        type: 'success',
        title: 'Guest Masuk!',
        desc: `Tamu "${guestName}" telah dicatat kehadirannya.`,
        detail: { ticket_code: guestCode, name: guestName, category: 'guest', checked_in_at: now }
      });
      setGuestName('');
      loadData();
    }
    setIsSubmitting(false);
  };

  const handleAddUndangan = async (e) => {
    e.preventDefault();
    if (!invName.trim()) return;

    setIsSubmitting(true);
    const code = invCode.trim() ? invCode.trim().toUpperCase() : `INV-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const { error } = await supabase.from('attendees').insert([{
      ticket_code: code,
      name: invName.trim(),
      category: 'undangan',
      is_checked_in: false
    }]);

    if (error) {
      alert("Gagal menambahkan: Kode tiket kemungkinan sudah ada.");
    } else {
      setInvName('');
      setInvCode('');
      loadData();
      alert(`Undangan untuk "${invName}" berhasil dibuat dengan kode ${code}!`);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id, name) => {
    const confirmDelete = window.confirm(`Yakin ingin menghapus data "${name}"?`);
    if (!confirmDelete) return;

    const { error } = await supabase.from('attendees').delete().eq('id', id);
    if (!error) loadData();
  };

  const copyLink = (ticketCode) => {
    const url = `${window.location.origin}/invitation?code=${ticketCode}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(ticketCode);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const filteredAttendees = recentAttendees.filter(item => 
    item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    item.ticket_code.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-16 antialiased">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-slate-900 text-base">DIYF Attendance</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                  Admin Deck
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Live Attendance & Fast-track Gate</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)} 
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                soundEnabled 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Audio On' : 'Mute'}</span>
            </button>
            <button 
              onClick={loadData}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-xs transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Perbarui Data"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">Tamu Undangan</span>
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600"><Users className="w-4 h-4" /></span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{stats.undanganHadir}</span>
              <span className="text-xs font-semibold text-slate-500">/ {stats.totalUndangan} hadir</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.totalUndangan > 0 ? (stats.undanganHadir / stats.totalUndangan) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">Guest Walk-In</span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><UserPlus className="w-4 h-4" /></span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600">{stats.guestHadir}</span>
              <span className="text-xs font-semibold text-slate-500">tamu on-site</span>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Meja registrasi langsung
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">Total Kehadiran</span>
              <span className="p-2 rounded-xl bg-violet-50 text-violet-600"><ShieldCheck className="w-4 h-4" /></span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{stats.undanganHadir + stats.guestHadir}</span>
              <span className="text-xs font-semibold text-slate-500">orang di lokasi</span>
            </div>
            <div className="mt-4 text-[11px] text-slate-500 font-medium">
              Tersinkronisasi otomatis
            </div>
          </div>
        </div>

        <div className="flex items-center justify-start overflow-x-auto pb-1">
          <div className="p-1 bg-slate-200/80 rounded-2xl flex gap-1 border border-slate-300/60">
            {[
              { id: 'scanner', label: 'Scan QR Tiket', icon: QrCode },
              { id: 'guest', label: 'Walk-In Guest', icon: UserPlus },
              { id: 'tambah_undangan', label: 'Tambah Undangan', icon: Sparkles },
              { id: 'list', label: `Daftar Hadir (${recentAttendees.length})`, icon: Users }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive 
                      ? 'bg-white text-indigo-700 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'scanner' && (
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 shadow-sm max-w-lg mx-auto text-center space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Pemindai QR Code</h3>
              <p className="text-xs text-slate-500 mt-0.5">Posisikan QR code tiket tamu di tengah area pemindaian.</p>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black shadow-inner">
              <div id="reader" className="w-full"></div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Kamera Aktif Otomatis
            </div>
          </div>
        )}

        {activeTab === 'guest' && (
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 shadow-sm max-w-md mx-auto">
            <div className="mb-6">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Meja Registrasi
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">Registrasi Cepat Tamu Walk-In</h3>
              <p className="text-xs text-slate-500 mt-1">
                Ketik nama tamu umum, tekan Simpan, dan status kehadiran langsung tercatat.
              </p>
            </div>

            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Nama Tamu *</label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Ketik nama lengkap..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !guestName.trim()}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50 text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-emerald-400" />
                {isSubmitting ? 'Memproses...' : 'Konfirmasi Masuk'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'tambah_undangan' && (
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 shadow-sm max-w-md mx-auto">
            <div className="mb-6">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Pra-Acara
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">Buat Undangan VIP/Tamu</h3>
              <p className="text-xs text-slate-500 mt-1">
                Data akan otomatis mendapatkan tautan e-pass digital berserta QR code personal.
              </p>
            </div>

            <form onSubmit={handleAddUndangan} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Nama Tamu Undangan *</label>
                <input
                  type="text"
                  required
                  value={invName}
                  onChange={(e) => setInvName(e.target.value)}
                  placeholder="Contoh: Bpk. Bambang Wijaya"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Kode Tiket (Opsional)</label>
                <input
                  type="text"
                  value={invCode}
                  onChange={(e) => setInvCode(e.target.value)}
                  placeholder="Kosongkan untuk otomatis (misal: INV-7K9A)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !invName.trim()}
                className="w-full py-3.5 bg-gradient-to-tr from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50 text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {isSubmitting ? 'Membuat Tiket...' : 'Simpan & Generate Tiket'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Rekapitulasi Kehadiran</h3>
                <p className="text-xs text-slate-500">Salin link undangan WhatsApp atau kelola entri tamu</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Cari nama atau kode tiket..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-400 font-mono uppercase text-[10px] border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Tiket</th>
                    <th className="py-3 px-4">Nama Tamu</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendees.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-10 text-slate-400">Tidak ada tamu yang cocok.</td>
                    </tr>
                  ) : (
                    filteredAttendees.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{item.ticket_code}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{item.name}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                            item.category === 'undangan' 
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {item.is_checked_in ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Hadir
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200">
                              Menunggu
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {item.category === 'undangan' && (
                              <button
                                onClick={() => copyLink(item.ticket_code)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-400 bg-white text-[11px] font-semibold text-slate-700 shadow-xs transition cursor-pointer"
                                title="Salin Link WhatsApp"
                              >
                                {copiedCode === item.ticket_code ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-600">Disalin!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    Link
                                  </>
                                )}
                              </button>
                            )}

                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition shadow-xs cursor-pointer"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {modalData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-6 text-center shadow-xl">
            <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
              modalData.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
              modalData.type === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
              'bg-rose-50 text-rose-600 border border-rose-100'
            }`}>
              {modalData.type === 'success' && <CheckCircle2 className="w-8 h-8" />}
              {modalData.type === 'warning' && <AlertTriangle className="w-8 h-8" />}
              {modalData.type === 'error' && <XCircle className="w-8 h-8" />}
            </div>

            <h4 className="text-base font-black text-slate-900">{modalData.title}</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{modalData.desc}</p>

            {modalData.detail?.name && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 my-4 text-left text-xs space-y-1">
                <div className="text-[10px] font-mono text-slate-400 font-semibold">{modalData.detail.ticket_code}</div>
                <div className="text-slate-900 font-bold text-sm">{modalData.detail.name}</div>
                <div className="text-indigo-600 uppercase font-extrabold text-[10px] tracking-wider">{modalData.detail.category}</div>
              </div>
            )}

            <button
              onClick={() => setModalData(null)}
              className="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              Lanjutkan Scan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}