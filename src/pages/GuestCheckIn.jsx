import { useState } from 'react';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { supabase } from '../supabase';

const createGuestCode = () => `GST-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

export default function GuestCheckIn() {
  const [name, setName] = useState('');
  const [submittedName, setSubmittedName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSubmitting(true);
    setError('');
    const { error: insertError } = await supabase.from('attendees').insert([{
      ticket_code: createGuestCode(),
      name: trimmedName,
      category: 'guest',
      is_checked_in: false,
      invitation_status: 'pending'
    }]);

    if (insertError) {
      setError(`Nama belum bisa dikirim: ${insertError.message}`);
    } else {
      setSubmittedName(trimmedName);
      setName('');
    }
    setIsSubmitting(false);
  };

  if (submittedName) {
    return (
      <main className="min-h-screen bg-[#f8f7fb] flex items-center justify-center p-5">
        <section className="w-full max-w-md bg-white rounded-[28px] p-7 text-center shadow-xl shadow-[#492e6e]/10 border border-[#492e6e]/10">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#ffb800]/20 text-[#492e6e] flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="mt-5 text-xl font-black text-slate-900">Nama berhasil dikirim</h1>
          <p className="mt-2 text-sm text-slate-500">
            Terima kasih, <strong className="text-slate-700">{submittedName}</strong>. Silakan tunggu konfirmasi panitia.
          </p>
          <button
            type="button"
            onClick={() => setSubmittedName('')}
            className="mt-6 w-full py-3 rounded-xl bg-[#492e6e] hover:bg-[#392354] text-white text-xs font-bold transition"
          >
            Daftarkan Nama Lain
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f7fb] flex items-center justify-center p-5">
      <section className="w-full max-w-md bg-white rounded-[28px] p-6 sm:p-8 shadow-xl shadow-[#492e6e]/10 border border-[#492e6e]/10">
        <div className="w-12 h-12 rounded-2xl bg-[#492e6e] text-[#ffb800] flex items-center justify-center">
          <UserPlus className="w-6 h-6" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-slate-900">Registrasi Kehadiran</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Masukkan nama lengkap. Data akan diperiksa dan dikonfirmasi oleh panitia di lokasi.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="guest-name" className="block mb-1.5 text-xs font-bold text-slate-700">Nama Lengkap</label>
            <input
              id="guest-name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ffb800] focus:bg-white"
            />
          </div>
          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full py-3.5 rounded-xl bg-[#492e6e] hover:bg-[#392354] text-white text-xs font-bold transition disabled:opacity-50"
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim Nama'}
          </button>
        </form>
      </section>
    </main>
  );
}
