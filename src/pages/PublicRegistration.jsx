import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Sparkles, Building2, GraduationCap, Clock, RefreshCw } from 'lucide-react';
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
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);
  const [closedMessage, setClosedMessage] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(true);

  const checkRegistrationStatus = async () => {
    setCheckingStatus(true);
    try {
      const { data } = await supabase
        .from('attendees')
        .select('is_checked_in, faculty')
        .eq('ticket_code', 'SYS-REG-STATUS')
        .maybeSingle();

      if (data) {
        setIsRegistrationOpen(Boolean(data.is_checked_in));
        if (!data.is_checked_in && data.faculty) {
          setClosedMessage(data.faculty);
        }
      } else {
        setIsRegistrationOpen(true);
      }
    } catch (e) {
      console.warn('Error checking registration status:', e);
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    checkRegistrationStatus();
  }, []);

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

    // Pre-check if registration was closed before submitting
    const { data: statusCheck } = await supabase
      .from('attendees')
      .select('is_checked_in, faculty')
      .eq('ticket_code', 'SYS-REG-STATUS')
      .maybeSingle();

    if (statusCheck && !statusCheck.is_checked_in) {
      setIsRegistrationOpen(false);
      setClosedMessage(statusCheck.faculty || 'Online public registration is currently closed.');
      setError('Public registration is currently closed by the committee.');
      setIsSubmitting(false);
      return;
    }

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
        ? 'A ticket code conflict occurred. Please submit again.'
        : `Registration failed: ${insertError.message}`);
    } else {
      navigate(`/invitation?code=${encodeURIComponent(code)}`);
    }
    setIsSubmitting(false);
  };

  if (checkingStatus) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#392354] via-[#492e6e] to-[#241533] flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-white/20 border-t-[#ffb800] rounded-full animate-spin"></div>
      </main>
    );
  }

  if (!isRegistrationOpen) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#392354] via-[#492e6e] to-[#241533] px-3 py-6 sm:p-6 font-sans">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#ffb800]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[#a66bd4]/20 blur-3xl" />
        <section className="relative w-full max-w-md rounded-[28px] sm:rounded-[32px] bg-white p-6 sm:p-8 text-center shadow-2xl shadow-black/30 border border-[#492e6e]/10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/diyf-logo.png" alt="DIYF" className="h-14 w-14 rounded-2xl bg-white object-contain p-1 shadow-md ring-1 ring-[#492e6e]/10" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300/60 mt-3">
            <Clock className="w-3.5 h-3.5" /> Registration Closed
          </span>

          <h1 className="mt-3 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            Registration Temporarily Closed
          </h1>
          <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            {closedMessage || 'Online public registration is currently closed. Registration will reopen on the event day at the venue.'}
          </p>

          <div className="mt-5 rounded-2xl border border-[#492e6e]/10 bg-[#492e6e]/5 p-4 text-left space-y-2 text-xs">
            <div className="font-bold text-[#492e6e] flex items-center justify-between">
              <span>Food Festival — DIYF 2026</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#492e6e]/10 text-[#492e6e] font-extrabold">Official Event</span>
            </div>
            <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
              <span>📅 Friday, Oct 16, 2026</span>
              <span>•</span>
              <span>📍 Widya Puraya, Undip</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1.5 border-t border-[#492e6e]/10 leading-relaxed">
              For unregistered visitors, on-site registration can be completed directly at the venue registration desk during the event.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={checkRegistrationStatus}
              className="w-full py-3 rounded-xl bg-[#492e6e] hover:bg-[#392354] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Check Registration Status
            </button>
            <a
              href="/invitation"
              className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition text-center"
            >
              Already Registered? View Your E-Pass
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#392354] via-[#492e6e] to-[#241533] px-3 py-5 sm:p-6 font-sans">
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#ffb800]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[#a66bd4]/20 blur-3xl" />
      
      <section className="relative w-full max-w-md rounded-[28px] sm:rounded-[32px] bg-white p-5 sm:p-8 shadow-2xl shadow-black/25 border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/diyf-logo.png" alt="DIYF" className="h-12 w-12 rounded-2xl bg-white object-contain p-1 shadow-md ring-1 ring-[#492e6e]/10" />
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#492e6e]/60">DIYF 2026</p>
              <p className="text-xs font-bold text-slate-700">Official Guest Registration</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#ffb800]/20 text-[#492e6e] border border-[#ffb800]/40">
            <Sparkles className="w-3 h-3 text-[#d69700]" /> Public Pass
          </span>
        </div>

        <div className="mt-5 h-px bg-slate-100" />
        
        <h1 className="mt-4 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
          Event Pass Registration
        </h1>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500 sm:text-sm">
          Register to attend the Food Festival and receive your official digital entry ticket.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <fieldset>
            <legend className="text-xs font-bold text-slate-700">Event</legend>
            <div className="mt-1.5">
              <div className="rounded-xl border border-[#492e6e] bg-[#492e6e]/5 p-3 ring-1 ring-[#492e6e]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">Food Festival</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Open</span>
                </div>
                <span className="mt-0.5 block text-[11px] font-normal text-slate-500">Free admission for registered guests</span>
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
              placeholder="e.g., Alex Johnson / Budi Santoso"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ffb800] transition"
            />
          </label>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              WhatsApp Number (Active) *
            </label>
            <div className="flex gap-2">
              <div className="relative w-36 shrink-0">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 px-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ffb800] truncate transition"
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
                  placeholder="8123456789 or 1234567890"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-3 text-sm font-normal text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ffb800] transition"
                />
              </div>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Select country code and type phone number (supports all countries).
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
                    ? 'bg-white text-[#492e6e] shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-[#ffb800]" />
                <span>Undip (Student/Staff)</span>
              </button>
              <button
                type="button"
                onClick={() => { setAffiliation('non_undip'); setFaculty(''); }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  affiliation === 'non_undip'
                    ? 'bg-white text-[#492e6e] shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-[#ffb800]" />
                <span>Non-Undip (General)</span>
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {affiliation === 'undip' ? (
              <label className="block text-xs font-bold text-slate-700">
                Faculty / School *
                <select
                  required
                  value={faculty}
                  onChange={(event) => setFaculty(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm font-normal text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ffb800] transition"
                >
                  <option value="">Select faculty or school</option>
                  {faculties.map(([label, abbreviation]) => (
                    <option key={abbreviation} value={`${label} (${abbreviation})`}>{label} ({abbreviation})</option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="block text-xs font-bold text-slate-700">
                Institution / School / Organization *
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(event) => setInstitution(event.target.value)}
                  placeholder="e.g. Gadjah Mada Univ, High School, General..."
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ffb800] transition"
                />
              </label>
            )}

            <label className="block text-xs font-bold text-slate-700">
              NIM / NIP / ID Number *
              <input
                type="text"
                required
                value={studentNumber}
                onChange={(event) => setStudentNumber(event.target.value)}
                placeholder={affiliation === 'undip' ? 'e.g. Student NIM or Staff NIP' : 'e.g. Student ID, Employee ID, or ID No.'}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ffb800] transition"
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
            {isSubmitting ? 'Registering...' : 'Get Digital Invitation Pass'}
          </button>
        </form>
      </section>
    </main>
  );
}
