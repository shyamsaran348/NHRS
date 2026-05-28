import React, { createContext, useContext, useState, useEffect } from 'react';
import { LogOut, ShieldAlert, Landmark, ShieldCheck, User } from 'lucide-react';
import Login from './pages/Login';
import DEDashboard from './pages/DEDashboard';
import DSEDashboard from './pages/DSEDashboard';
import DCEDashboard from './pages/DCEDashboard';

import tamilNaduLogo from './assets/Emblem_of_Tamil_Nadu.svg';
import nhaiLogo from './assets/National_Highways_Authority_of_India_logo.svg.png';

// Global Authentication Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// High-Fidelity Government of Tamil Nadu Crest emblem component
export const TamilNaduCrest = ({ className = "w-10 h-10" }) => (
  <img src={tamilNaduLogo} className={`${className} object-contain shrink-0`} alt="Government of Tamil Nadu Emblem" />
);

// Ashoka Lion NHAI Logo emblem component
export const NHAILogo = ({ className = "h-9" }) => (
  <img src={nhaiLogo} className={`${className} object-contain shrink-0`} alt="National Highways Authority of India Emblem" />
);

// GIGW Standard Accessibility Top-bar
export function AccessibilityBar({ fontScale, setFontScale }) {
  return (
    <div className="bg-slate-900 text-slate-300 text-[10px] px-6 py-2 flex items-center justify-between border-b border-slate-800 tracking-wide font-bold shrink-0 select-none">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 text-white font-extrabold">
          <span className="inline-block w-4 h-2.5 bg-gradient-to-r from-[#FF9933] via-white to-[#128807] rounded-sm shrink-0 border border-slate-700/40"></span>
          தமிழ்நாடு அரசு | Government of Tamil Nadu
        </span>
        <span className="hidden md:inline text-slate-700">|</span>
        <a href="#main-content" className="hidden md:inline text-slate-400 hover:text-white transition-colors">Screen Reader Access</a>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Font controls */}
        <div className="flex items-center gap-1.5 border-r border-slate-800 pr-4">
          <span className="text-[9px] text-slate-500 uppercase font-extrabold mr-1">Text Size:</span>
          <button 
            onClick={() => setFontScale(90)} 
            className={`w-5 h-5 flex items-center justify-center rounded border transition-all text-[10px] font-extrabold ${
              fontScale === 90 
                ? 'bg-teal-600 text-white border-teal-500 shadow-sm' 
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Decrease Font Size (A-)"
          >
            A-
          </button>
          <button 
            onClick={() => setFontScale(100)} 
            className={`w-5 h-5 flex items-center justify-center rounded border transition-all text-[10px] font-extrabold ${
              fontScale === 100 
                ? 'bg-teal-600 text-white border-teal-500 shadow-sm' 
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Normal Font Size (A)"
          >
            A
          </button>
          <button 
            onClick={() => setFontScale(115)} 
            className={`w-5 h-5 flex items-center justify-center rounded border transition-all text-[10px] font-extrabold ${
              fontScale === 115 
                ? 'bg-teal-600 text-white border-teal-500 shadow-sm' 
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Increase Font Size (A+)"
          >
            A+
          </button>
        </div>

        {/* Bilingual indicator */}
        <div className="flex items-center gap-1.5 text-[9px] font-black tracking-wider">
          <span className="text-teal-400 cursor-pointer hover:underline">ENGLISH</span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400 cursor-pointer hover:text-white transition-colors">தமிழ்</span>
        </div>
      </div>
    </div>
  );
}

// Reusable GIGW-compliant Footer component
export function GIGWFooter({ onOpenPolicy }) {
  return (
    <footer className="bg-slate-900 text-slate-400 py-6 px-6 border-t border-slate-800 text-xs flex flex-col md:flex-row items-center justify-between gap-4 font-semibold select-none shadow-inner w-full shrink-0">
      <div className="text-center md:text-left space-y-1">
        <div>
          © 2026 National Highways Research Station (NHRS), Government of Tamil Nadu. All rights reserved.
        </div>
      </div>

      {/* GIGW website policies */}
      <div className="flex flex-wrap justify-center gap-3 md:gap-4 text-[10px] text-slate-400 font-bold border-y md:border-y-0 border-slate-800 py-2 md:py-0">
        <button onClick={() => onOpenPolicy('privacy')} className="hover:text-white transition-colors cursor-pointer focus:outline-none">Privacy Policy</button>
        <span className="text-slate-700">|</span>
        <button onClick={() => onOpenPolicy('hyperlinking')} className="hover:text-white transition-colors cursor-pointer focus:outline-none">Hyperlinking Policy</button>
        <span className="text-slate-700">|</span>
        <button onClick={() => onOpenPolicy('copyright')} className="hover:text-white transition-colors cursor-pointer focus:outline-none">Copyright Policy</button>
        <span className="text-slate-700">|</span>
        <button onClick={() => onOpenPolicy('terms')} className="hover:text-white transition-colors cursor-pointer focus:outline-none">Terms & Conditions</button>
      </div>

      <div className="flex flex-col items-center md:items-end">
        <div className="text-[10px] text-slate-500">
          Last Updated: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
        </div>
      </div>
    </footer>
  );
}

// Reusable Policy Dialog Modal
export function PolicyModal({ activePolicy, onClose }) {
  if (!activePolicy) return null;

  const policies = {
    privacy: {
      title: "Privacy Policy",
      content: (
        <div className="space-y-4 text-xs md:text-sm text-slate-600 leading-relaxed font-semibold">
          <p>
            This portal is owned and operated by the <strong>National Highways Research Station (NHRS), Guindy, Chennai, Government of Tamil Nadu</strong>. We are committed to protecting your secure credentials, circle configurations, project cost details, and system interaction logs.
          </p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] text-teal-700">Data Collection Policies</h4>
            <p>
              The portal strictly logs secure administrative parameters: official email addresses, user IP logs, and system audit trail stamps. No tracking scripts or commercial analytical elements are deployed.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] text-teal-700">Information Security</h4>
            <p>
              All active authentication sessions use highly secure, encrypted JSON Web Tokens (JWT) stored in browser storage vaults. All circle configurations and project audit logs are persisted inside highly secured Government of Tamil Nadu database server networks.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] text-teal-700">Role-Based Access Disclosures</h4>
            <p>
              Information submitted by Divisional Engineers is strictly restricted to Circle Superintendent Engineers and Central Deputy Chief Engineers under robust Role-Based Access Control (RBAC). Under no circumstances is operational data shared with third-party networks.
            </p>
          </div>
        </div>
      )
    },
    hyperlinking: {
      title: "Hyperlinking Policy",
      content: (
        <div className="space-y-4 text-xs md:text-sm text-slate-600 leading-relaxed font-semibold">
          <p>
            Establishment of links to this portal or external redirections are guided by the secure administrative standards of the <strong>Government of Tamil Nadu</strong>:
          </p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] text-teal-700">Inbound Hyperlinks to NHRS Portal</h4>
            <p>
              Prior written permission is required from the NHRS IT Cell before any external web portal can create hyperlinks directly to this secure intranet console.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] text-teal-700">Outbound Administrative Redirects</h4>
            <p>
              This portal does not hyperlink to external commercial or promotional web spaces. Outbound links to central ministry nodes (such as MoRTH or NHAI) are provided solely for administrative convenience. NHRS is not responsible for the contents or reliability of linked websites.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] text-teal-700">Visual Integrity and Framing</h4>
            <p>
              We do not permit our administrative dashboard pages to be loaded into frames on external websites. The NHRS secure console must load into a newly opened browser tab/window to preserve absolute visual and session integrity.
            </p>
          </div>
        </div>
      )
    },
    copyright: {
      title: "Copyright Policy",
      content: (
        <div className="space-y-4 text-xs md:text-sm text-slate-600 leading-relaxed font-semibold">
          <p>
            All administrative contents and digital layouts hosted on the NHRS portal are protected under copyright guidelines:
          </p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] text-teal-700">Material Ownership</h4>
            <p>
              All materials, system layouts, form schemas, test data, and technical review logs on this website are the copyright of the <strong>National Highways Research Station (NHRS), Government of Tamil Nadu</strong>, unless otherwise indicated.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] text-teal-700">Authorized Reproduction</h4>
            <p>
              The material may be downloaded or reproduced for official department work without requiring specific written permission, provided it is reproduced accurately, not used in a derogatory or misleading manner, and the source is prominently acknowledged.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] text-teal-700">Restricted Commercial Use</h4>
            <p>
              The permission to reproduce this material does not extend to any material which is identified as being copyright of a third party or restricted authorization tokens. Commercial redistribution is strictly prohibited.
            </p>
          </div>
        </div>
      )
    },
    terms: {
      title: "Terms & Conditions",
      content: (
        <div className="space-y-4 text-xs md:text-sm text-slate-600 leading-relaxed font-semibold">
          <p>
            This portal is designed, developed, and maintained by the <strong>National Informatics Centre (NIC) / NHRS Chennai IT Cell</strong> for official administrative use by authorized highway engineers of the Government of Tamil Nadu.
          </p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] text-teal-700">Authorized Access Only</h4>
            <p>
              Unauthorized attempts to access this dashboard, submit falsified project records, or bypass circle role boundaries are strictly prohibited and punishable under the Indian Information Technology (IT) Act, 2000.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] text-teal-700">Audit and Logging</h4>
            <p>
              Every interaction (including login, quick-login, form submission, team modification, circle configuration, and reviews) is permanently stamped with an administrative audit log containing user metadata.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] text-teal-700">Circle-Level Data Disclaimer</h4>
            <p>
              While utmost care is taken to ensure data consistency, the figures displayed reflect circle-level entries and are subject to final budget allocation reviews by the Chief Office.
            </p>
          </div>
        </div>
      )
    }
  };

  const currentPolicy = policies[activePolicy];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 bg-teal-600 h-4 rounded-sm"></span>
            {currentPolicy.title}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 p-1.5 rounded-lg transition-all text-sm font-extrabold"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          {currentPolicy.content}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50/50 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
          >
            I Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}

// Reusable GIGW-compliant Profile Modal
export function ProfileModal({ isOpen, onClose, onProfileUpdated }) {
  const { user, token } = useAuth();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }

    if (password) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: name.trim(),
        password: password || null
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Failed to update profile.');
        }
        return data;
      })
      .then((updatedUser) => {
        setSuccess('Profile updated successfully!');
        if (onProfileUpdated) {
          onProfileUpdated(updatedUser);
        }
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
        }, 1500);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full max-h-[90vh] flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 bg-teal-600 h-4 rounded-sm"></span>
            Manage Account Profile
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 p-1.5 rounded-lg transition-all text-sm font-extrabold"
            aria-label="Close profile modal"
          >
            ✕
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-750 p-3 rounded-xl text-xs font-bold leading-relaxed">
              {success}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-655 p-3 rounded-xl text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}

          {/* Read-Only Identity Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[11px] leading-relaxed space-y-2 text-slate-600 font-semibold">
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-400 uppercase font-bold text-[9px]">Official Email:</span>
              <span className="text-slate-800">{user.email}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-400 uppercase font-bold text-[9px]">Designation:</span>
              <span className="text-teal-800 font-extrabold uppercase text-[9px] bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                {user.role === 'DCE' ? 'Deputy Chief Engineer' : user.role === 'DSE' ? 'Superintendent Engineer' : 'Divisional Engineer'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1.5">
              <span className="text-slate-400 uppercase font-bold text-[9px]">Circle Assignment:</span>
              <span className="text-slate-800">{user.circle?.name || 'Central Head Office'}</span>
            </div>
            {user.role === 'DE' && (
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase font-bold text-[9px]">Division Branch:</span>
                <span className="text-slate-800">{user.division?.name || 'N/A'}</span>
              </div>
            )}
          </div>

          {/* Editable Full Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
              Full Name & Initial
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Er. K. Ramesh"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-all font-semibold"
              required
            />
          </div>

          {/* Password update section */}
          <div className="border-t border-slate-100 pt-3 space-y-3">
            <div className="text-[10px] font-black text-slate-450 uppercase tracking-widest">
              Modify Account Password
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-all font-medium"
              />
            </div>

            {password && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 transition-all font-medium"
                  required={!!password}
                />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-655 font-bold uppercase rounded-xl tracking-wider text-[10px] hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold uppercase rounded-xl tracking-wider text-[10px] transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePolicy, setActivePolicy] = useState(null); // 'privacy' | 'hyperlinking' | 'copyright' | 'terms' | null
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Font scale (accessibility support)
  const [fontScale, setFontScale] = useState(() => {
    return parseInt(localStorage.getItem('fontScale')) || 100;
  });

  useEffect(() => {
    localStorage.setItem('fontScale', fontScale);
    document.documentElement.style.fontSize = `${(fontScale / 100) * 16}px`;
  }, [fontScale]);

  // Fetch current user details
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Session expired');
        }
        return res.json();
      })
      .then(data => {
        setUser(data);
        setError('');
      })
      .catch(err => {
        console.error(err);
        logout();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const login = async (email, password) => {
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  // Modern Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] flex flex-col items-center justify-center text-slate-700">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-teal-600/10 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-teal-600 rounded-full animate-spin"></div>
        </div>
        <p className="text-teal-600 font-bold tracking-wide">Securing connection to portal...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, error, login, logout, setError }}>
      {!user ? (
        <Login fontScale={fontScale} setFontScale={setFontScale} onOpenPolicy={setActivePolicy} />
      ) : (
        <div className="min-h-screen bg-[#f4f6f9] text-slate-800 flex flex-col">
          {/* GIGW Accessibility Header Bar */}
          <AccessibilityBar fontScale={fontScale} setFontScale={setFontScale} />

          {/* Global Government Header */}
          <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 px-6 py-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1.5 rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
                <TamilNaduCrest className="w-9 h-9" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span>தேசிய நெடுஞ்சாலைகள் ஆராய்ச்சி நிலையம்</span>
                  <span className="text-xs bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-full font-bold border border-teal-200/60 uppercase self-start sm:self-auto shrink-0">
                    NHRS PORTAL
                  </span>
                </h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  National Highways Research Station, Guindy, Chennai
                </p>
              </div>
            </div>

            {/* NHAI secondary branding (right side header) */}
            <div className="hidden lg:flex items-center gap-2 border-l border-slate-200 pl-4 mr-auto ml-6">
              <NHAILogo className="h-9 opacity-90 hover:opacity-100 transition-opacity" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">NHAI Oversight</span>
            </div>

            {/* Profile Info and Logout */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-black text-slate-800">{user.name}</div>
                <div className="flex items-center gap-1 justify-end mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                    {user.role === 'DCE' ? 'Deputy Chief Engineer' : user.role === 'DSE' ? 'Superintendent Engineer' : 'Divisional Engineer'}
                  </span>
                </div>
              </div>

              {/* Profile button */}
              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-700 rounded-xl border border-slate-200 hover:border-teal-200 transition-all text-xs font-bold cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden md:inline">My Profile</span>
              </button>

              {/* Action Log Out */}
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-xl border border-slate-200 hover:border-red-200 transition-all text-xs font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Secure Logout</span>
              </button>
            </div>
          </header>

          {/* Main Dashboard Render with Role-Guard fallbacks */}
          <main className="flex-1 p-6" id="main-content">
            {user.role === 'DE' ? (
              <DEDashboard />
            ) : user.role === 'DSE' ? (
              <DSEDashboard />
            ) : user.role === 'DCE' ? (
              <DCEDashboard />
            ) : (
              <div className="glass-panel p-12 max-w-md mx-auto rounded-2xl border border-red-200 text-center space-y-4 shadow-md bg-white">
                <ShieldAlert className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Unauthorized Operations Threat
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Your active role authorization scope does not match Guindy secure directory policies. This attempt has been logged in system audits.
                </p>
                <button
                  onClick={logout}
                  className="px-5 py-2.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 text-xs font-bold uppercase rounded-xl tracking-wider transition-all"
                >
                  Terminate Session
                </button>
              </div>
            )}
          </main>

          {/* Secure System GIGW Compliant Footer */}
          <GIGWFooter onOpenPolicy={setActivePolicy} />
        </div>
      )}
      {/* Global Interactive Policy Modal */}
      <PolicyModal activePolicy={activePolicy} onClose={() => setActivePolicy(null)} />
      {/* Global Profile Management Modal */}
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        onProfileUpdated={(updatedUser) => setUser(updatedUser)} 
      />
    </AuthContext.Provider>
  );
}
