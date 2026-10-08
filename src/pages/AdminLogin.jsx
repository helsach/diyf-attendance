import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { supabase } from '../supabase';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError('Email atau password admin tidak valid.');
    } else {
      navigate('/admin', { replace: true });
    }
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-[#f8f7fb] flex items-center justify-center p-4 text-slate-800">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-[#492e6e]/10 rounded-3xl p-7 shadow-xl shadow-[#492e6e]/10">
        <div className="w-14 h-14 rounded-2xl bg-white border border-[#ffb800]/50 flex items-center justify-center mb-5 shadow-sm overflow-hidden">
          <img src="/diyf-logo.png" alt="DIYF" className="h-full w-full object-contain p-1.5" />
        </div>
        <h1 className="text-xl font-black text-[#492e6e]">DIYF Attendance</h1>
        <p className="text-xs text-slate-500 mt-1 mb-6">Masuk untuk mengelola presensi acara.</p>

        {error && <p className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">{error}</p>}

        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-700">
            Email admin
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#ffb800] focus:bg-white" />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Password
            <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#ffb800] focus:bg-white" />
          </label>
          <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-[#492e6e] hover:bg-[#392354] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
            <LogIn className="w-4 h-4" />
            {isSubmitting ? 'Memeriksa...' : 'Masuk ke Admin'}
          </button>
        </div>
      </form>
    </main>
  );
}
