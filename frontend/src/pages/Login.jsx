import React, { useState, useEffect } from 'react';
import { useAuth, AccessibilityBar, GIGWFooter } from '../App';
import { ShieldCheck, Lock, Mail, Landmark, Sparkles, User, Building } from 'lucide-react';
import tamilNaduLogo from '../assets/Emblem_of_Tamil_Nadu.svg';

export default function Login({ fontScale, setFontScale, onOpenPolicy }) {
  const { login, error, setError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Registration form states
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('DE'); // 'DE' or 'DSE'
  const [regCircle, setRegCircle] = useState('');
  const [regDivision, setRegDivision] = useState('');
  const [circles, setCircles] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [regSuccess, setRegSuccess] = useState('');

  // Fetch circles list on register toggle
  useEffect(() => {
    if (isRegistering) {
      setError('');
      setRegSuccess('');
      fetch('/api/circles')
        .then(res => {
          if (!res.ok) throw new Error('Failed to load circles');
          return res.json();
        })
        .then(data => setCircles(data))
        .catch(err => console.error("Failed to load circles metadata:", err));
    }
  }, [isRegistering, setError]);

  // Fetch divisions list when circle changes
  useEffect(() => {
    if (regCircle) {
      fetch(`/api/divisions?circle_id=${regCircle}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to load divisions');
          return res.json();
        })
        .then(data => {
          setDivisions(data);
          setRegDivision('');
        })
        .catch(err => console.error("Failed to load divisions metadata:", err));
    } else {
      setDivisions([]);
      setRegDivision('');
    }
  }, [regCircle]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    const success = await login(email, password);
    setSubmitting(false);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRegSuccess('');

    if (!regName || !regEmail || !regPassword || !regRole || !regCircle) {
      setError('Please fill in all mandatory fields.');
      return;
    }
    if (regRole === 'DE' && !regDivision) {
      setError('Divisional Engineers must select their active Division branch.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole,
          circle_id: parseInt(regCircle),
          division_id: regDivision ? parseInt(regDivision) : null
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed.');
      }

      setRegSuccess('Your portal credentials request has been successfully registered!');
      setEmail(regEmail);
      setPassword('');
      
      // Reset registration form fields
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegCircle('');
      setRegDivision('');
      
      // Auto-toggle back to login screen after 2.5s
      setTimeout(() => {
        setIsRegistering(false);
        setRegSuccess('');
      }, 2500);

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail) => {
    setSubmitting(true);
    await login(demoEmail, 'Password123!');
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col relative overflow-hidden">
      {/* GIGW Accessibility Header Bar */}
      <AccessibilityBar fontScale={fontScale} setFontScale={setFontScale} />

      <div className="flex-1 flex items-center justify-center p-4 relative">
        {/* Visual background glow elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/2 rounded-full filter blur-[100px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/2 rounded-full filter blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="w-full max-w-md relative z-10">
          {/* Government Header Branding */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200 mb-4 animate-bounce flex items-center justify-center w-16 h-16 mx-auto" style={{ animationDuration: '3s' }}>
              <img src={tamilNaduLogo} className="w-12 h-12 object-contain shrink-0" alt="Government of Tamil Nadu Emblem" />
            </div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">தமிழ்நாடு அரசு | GOVT OF TAMIL NADU</h2>
            <p className="text-[10px] font-black text-teal-700 tracking-wider uppercase mt-1">
              தேசிய நெடுஞ்சாலைகள் ஆராய்ச்சி நிலையம் | NHRS CHENNAI
            </p>
          </div>

          {/* Form Panel */}
          <div className="glass-panel p-8 rounded-2xl shadow-md relative bg-white">
            {regSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3.5 rounded-xl text-xs font-bold leading-relaxed mb-4 animate-pulse">
                {regSuccess}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs font-semibold leading-relaxed mb-4">
                {error}
              </div>
            )}

            {!isRegistering ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Official Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. de_ccr_1@nhrs.gov.in"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Account Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-[#0f766e] hover:bg-[#0d9488] text-white rounded-xl font-bold tracking-wide text-sm shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 glow-btn disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Verifying Secure Token...' : 'Authenticate & Sign In'}
                </button>

                <div className="pt-3 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setError('');
                    }}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors focus:outline-none cursor-pointer"
                  >
                    Request Portal Credentials (Sign Up)
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Full Name & Initial
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Er. K. Ramesh"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Official Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. de_ccr_1@nhrs.gov.in"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Portal Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 8 chars (1 Upper, 1 Special)"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-teal-600" />
                    Administrative Designation
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-all font-semibold"
                    required
                  >
                    <option value="DE">Divisional Engineer (DE)</option>
                    <option value="DSE">Superintendent Engineer (DSE)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <Building className="w-3 h-3 text-teal-600" />
                      Circle Branch
                    </label>
                    <select
                      value={regCircle}
                      onChange={(e) => setRegCircle(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-[11px] text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-all font-semibold select-none"
                      required
                    >
                      <option value="">Select Circle...</option>
                      {circles.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <Building className="w-3 h-3 text-teal-600" />
                      Division Office
                    </label>
                    <select
                      value={regDivision}
                      onChange={(e) => setRegDivision(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-[11px] text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-all font-semibold disabled:opacity-50 select-none"
                      disabled={regRole !== 'DE' || !regCircle}
                      required={regRole === 'DE'}
                    >
                      <option value="">Select Division...</option>
                      {divisions.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 bg-[#0f766e] hover:bg-[#0d9488] text-white rounded-xl font-bold tracking-wide text-xs shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 glow-btn disabled:opacity-50 mt-2 cursor-pointer"
                >
                  {submitting ? 'Registering Credentials...' : 'Register Secure Profile'}
                </button>

                <div className="pt-2 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(false);
                      setError('');
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors focus:outline-none cursor-pointer"
                  >
                    Back to Secure Sign In
                  </button>
                </div>
              </form>
            )}
          </div>

        {/* Demo Fast Login Panel */}
        <div className="glass-panel mt-6 p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 mb-4 text-slate-700">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-teal-600">
              NHRS Demo Quick-Access Profile
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-semibold">
            Use these pre-seeded government test profiles to quickly evaluate roles and approvals (password: <code className="text-teal-700 bg-teal-50 border border-teal-100/60 px-1.5 py-0.5 rounded font-bold">Password123!</code>):
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            <button
              onClick={() => handleQuickLogin('de_ccr_1@nhrs.gov.in')}
              disabled={submitting}
              className="px-3.5 py-2.5 bg-teal-50/20 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl text-left transition-all group"
            >
              <div className="text-xs font-bold text-slate-800 group-hover:text-teal-600">Divisional Engineer (DE)</div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-bold">CCR 1 Division (Chennai Circle) | Form Entry</div>
            </button>

            <button
              onClick={() => handleQuickLogin('dse_chennai@nhrs.gov.in')}
              disabled={submitting}
              className="px-3.5 py-2.5 bg-indigo-50/20 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all group"
            >
              <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Deputy Superintendent Engineer (DSE)</div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-bold">Chennai Circle | Review, Approvals, & Team Config</div>
            </button>

            <button
              onClick={() => handleQuickLogin('dce@nhrs.gov.in')}
              disabled={submitting}
              className="px-3.5 py-2.5 bg-purple-50/20 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl text-left transition-all group"
            >
              <div className="text-xs font-bold text-slate-800 group-hover:text-purple-600">Deputy Chief Engineer (DCE)</div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-bold">Super Admin | Global Console, Filters, & Excel Report</div>
            </button>
          </div>
        </div>
      </div>
    </div>
      
    {/* Reusable GIGW Compliance Footer */}
    <GIGWFooter onOpenPolicy={onOpenPolicy} />
  </div>
  );
}
