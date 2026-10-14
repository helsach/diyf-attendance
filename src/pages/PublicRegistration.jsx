import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Sparkles, Building2, GraduationCap } from 'lucide-react';
import { supabase } from '../supabase';
import { allCountryCodes, normalizeWhatsAppNumber, isValidWhatsAppNumber } from '../utils/phoneUtils';

const createTicketCode = () => `GST-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
const faculties = [
  ['Faculty of Law', 'FH'],
  ['Faculty of Economics and Business', 'FEB'],
  ['Faculty of Engineering', 'FT'],
  ['Faculty of Medicine', 'FK'],
  ['Faculty of Animal and Agricultural Sciences', 'FPP'],
  ['Faculty of Fisheries and Marine Sciences', 'FPIK'],
  ['Faculty of Science and Mathematics', 'FSM'],
  ['Faculty of Public Health', 'FKM'],
  ['Faculty of Social and Political Sciences', 'FISIP'],
  ['Faculty of Humanities', 'FIB'],
  ['Faculty of Psychology', 'FPsi'],
  ['School of Vocational Studies', 'SV'],
  ['Other', 'Other']
];

export default function PublicRegistration() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('62');
  const [affiliation, setAffiliation] = useState('undip'); // 'undip' | 'non_undip'
  const [faculty, setFaculty] = useState('');
  const [institution, setInstitution] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedStudentNumber = studentNumber.trim();
    const affiliationValue = affiliation === 'undip' ? faculty : institution.trim();
    const normalizedPhone = normalizeWhatsAppNumber(phone, countryCode);
    const code = createTicketCode();

    if (!trimmedName || !phone.trim() || !affiliationValue || !trimmedStudentNumber) return;

    if (!isValidWhatsAppNumber(normalizedPhone)) {
      setError('Invalid WhatsApp number. Please check your country code and phone digits.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    const { error: insertError } = await supabase.from('attendees').insert([{
      ticket_code: code,
      name: trimmedName,
      phone: normalizedPhone,
      event_names: ['food_festival'],
      event_name: 'food_festival',
      faculty: affiliationValue,
      student_number: trimmedStudentNumber,
      category: 'guest',
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
          Register for the Food Festival and submit your details to receive an official digital invitation.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <fieldset>
            <legend className="text-xs font-bold text-slate-700">Event</legend>
            <div className="mt-1.5 grid gap-2">
              <div className="rounded-xl border border-[#492e6e] bg-[#492e6e]/5 p-3 ring-1 ring-[#492e6e]">
                <span className="text-sm font-bold text-slate-800">Food Festival</span>
                <span className="mt-0.5 block text-[11px] font-normal text-slate-500">Open for public registration</span>
              </div>
            </div>
          </fieldset>

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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              WhatsApp Number *
            </label>
            <div className="flex gap-2">
              <div className="relative w-36 shrink-0">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 px-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ffb800] truncate"
                >
                  {allCountryCodes.map((c, idx) => (
                    <option key={`${c.code}-${idx}`} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative flex-1">
                <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="8123456789 or +60..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-sm font-normal text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ffb800]"
                />
              </div>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Supports domestic and international WhatsApp numbers.
            </p>
          </div>

          {/* Affiliation Option: Undip vs Non-Undip */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Affiliation / Category *
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => { setAffiliation('undip'); setInstitution(''); }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  affiliation === 'undip'
                    ? 'bg-white text-[#492e6e] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Undip</span>
              </button>
              <button
                type="button"
                onClick={() => { setAffiliation('non_undip'); setFaculty(''); }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  affiliation === 'non_undip'
                    ? 'bg-white text-[#492e6e] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Non-Undip (Public)</span>
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {affiliation === 'undip' ? (
              <label className="block text-xs font-bold text-slate-700">
                Faculty *
                <select
                  required
                  value={faculty}
                  onChange={(event) => setFaculty(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-normal text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ffb800]"
                >
                  <option value="">Select faculty</option>
                  {faculties.map(([label, abbreviation]) => (
                    <option key={abbreviation} value={`${label} (${abbreviation})`}>{label} ({abbreviation})</option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="block text-xs font-bold text-slate-700">
                Institution / Organization *
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(event) => setInstitution(event.target.value)}
                  placeholder="e.g. Unnes, Unissula, General..."
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ffb800]"
                />
              </label>
            )}

            <label className="block text-xs font-bold text-slate-700">
              NIM / NIP *
              <input
                type="text"
                required
                value={studentNumber}
                onChange={(event) => setStudentNumber(event.target.value)}
                placeholder={affiliation === 'undip' ? 'e.g. 24060123... or 1985...' : 'e.g. ID Number / KTP / -'}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ffb800]"
              />
            </label>
          </div>

          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !phone.trim() || (affiliation === 'undip' ? !faculty : !institution.trim()) || !studentNumber.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-[#492e6e] to-[#6d4792] py-3.5 text-xs font-bold text-white shadow-lg shadow-[#492e6e]/20 transition hover:from-[#392354] hover:to-[#492e6e] disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            {isSubmitting ? 'Submitting...' : 'Submit Registration'}
          </button>
        </form>
      </section>
    </main>
  );
}
