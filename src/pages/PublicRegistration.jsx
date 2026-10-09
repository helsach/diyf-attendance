import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Sparkles } from 'lucide-react';
import { supabase } from '../supabase';

const createTicketCode = () => `INV-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

export default function PublicRegistration() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const normalizedPhone = phone.replace(/[^\d+]/g, '').replace(/^0/, '62');
    const code = createTicketCode();

    if (!trimmedName || !phone.trim()) return;

    if (!/^\+?\d{10,15}$/.test(normalizedPhone)) {
      setError('Invalid WhatsApp number. Use the 08... or 628... format.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    const { error: insertError } = await supabase.from('attendees').insert([{
      ticket_code: code,
      name: trimmedName,
      phone: normalizedPhone,
      category: 'undangan',
      is_checked_in: false,
      invitation_status: 'pending'
    }]);

    if (insertError) {
      setError(insertError.code === '23505'
        ? 'A ticket could not be generated. Please submit again.'
        : `Registration failed: ${insertError.message}`);
    } else {
      navigate(`/invitation?code=${encodeURIComponent(code)}`);
    }
    setIsSubmitting(false);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#392354] via-[#492e6e] to-[#241533] px-3 py-5 sm:p-6">
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#ffb800]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[#a66bd4]/20 blur-3xl" />
      <section className="relative w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl shadow-black/25 sm:rounded-[32px] sm:p-8">
        <div className="flex items-center gap-3">
          <img src="/diyf-logo.png" alt="DIYF" className="h-12 w-12 rounded-2xl bg-white object-contain p-1 shadow-md ring-1 ring-[#492e6e]/10" />
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#492e6e]/60">DIYF 2026</p>
            <p className="text-xs font-bold text-slate-500">Guest Registration</p>
          </div>
        </div>
        <div className="mt-6 h-px bg-slate-100" />
        <h1 className="mt-5 text-xl font-black tracking-tight text-slate-900 sm:mt-6 sm:text-2xl">Invitation Registration</h1>
        <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
          Submit your details to receive an official digital invitation.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-xs font-bold text-slate-700">
            Full Name *
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Example: Budi Santoso"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ffb800]"
            />
          </label>

          <label className="block text-xs font-bold text-slate-700">
            WhatsApp Number *
            <span className="relative mt-1.5 block">
              <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="081234567890"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm font-normal text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ffb800]"
              />
            </span>
          </label>

          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !phone.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-[#492e6e] to-[#6d4792] py-3.5 text-xs font-bold text-white shadow-lg shadow-[#492e6e]/20 transition hover:from-[#392354] hover:to-[#492e6e] disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            {isSubmitting ? 'Submitting...' : 'Submit Registration'}
          </button>
        </form>
      </section>
    </main>
  );
}
