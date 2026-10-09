import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
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
      setError(`Your name could not be submitted: ${insertError.message}`);
    } else {
      setSubmittedName(trimmedName);
      setName('');
    }
    setIsSubmitting(false);
  };

  if (submittedName) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#392354] via-[#492e6e] to-[#241533] flex items-center justify-center p-5">
        <section className="w-full max-w-md bg-white rounded-[32px] p-7 text-center shadow-2xl shadow-black/25">
          <img src="/diyf-logo.png" alt="DIYF" className="h-14 w-14 mx-auto rounded-2xl object-contain bg-white p-1 shadow-md ring-1 ring-[#492e6e]/10" />
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#ffb800]/20 text-[#492e6e] flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="mt-5 text-xl font-black text-slate-900">Name submitted successfully</h1>
          <p className="mt-2 text-sm text-slate-500">
            Thank you, <strong className="text-slate-700">{submittedName}</strong>. Please wait for the committee's confirmation.
          </p>
          <button
            type="button"
            onClick={() => setSubmittedName('')}
            className="mt-6 w-full py-3 rounded-xl bg-[#492e6e] hover:bg-[#392354] text-white text-xs font-bold transition"
          >
            Register Another Name
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#392354] via-[#492e6e] to-[#241533] relative overflow-hidden flex items-center justify-center p-5">
      <div className="pointer-events-none absolute -top-28 -right-24 h-72 w-72 rounded-full bg-[#ffb800]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[#a66bd4]/20 blur-3xl" />
      <section className="relative w-full max-w-md bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl shadow-black/25">
        <div className="flex items-center gap-3">
          <img src="/diyf-logo.png" alt="DIYF" className="h-12 w-12 rounded-2xl object-contain bg-white p-1 shadow-md ring-1 ring-[#492e6e]/10" />
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#492e6e]/60">DIYF 2026</p>
            <p className="text-xs font-bold text-slate-500">Guest Registration</p>
          </div>
        </div>
        <div className="mt-6 h-px bg-slate-100" />
        <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-900">Attendance Registration</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Enter your full name. The committee will review and confirm your registration at the venue.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="guest-name" className="block mb-1.5 text-xs font-bold text-slate-700">Full Name</label>
            <input
              id="guest-name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Example: Budi Santoso"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ffb800] focus:bg-white"
            />
          </div>
          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="w-full py-3.5 rounded-xl bg-[#492e6e] hover:bg-[#392354] text-white text-xs font-bold transition disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Name'}
          </button>
        </form>
      </section>
    </main>
  );
}
