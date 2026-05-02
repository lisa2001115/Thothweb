import { useState } from 'react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface AdminLoginScreenProps {
  onSuccess: () => void;
  onBack: () => void;
}

type Tab = 'login' | 'signup';

// ── Sub-components defined OUTSIDE the parent so React never remounts them ──

interface EmailFieldProps {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

function EmailField({ value, onChange, error }: EmailFieldProps) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1.5">T-Mobile Email</label>
      <div
        className={`flex items-center border rounded-xl overflow-hidden transition-colors focus-within:border-[#E20074] ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
      >
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value.replace(/@.*/, ''))}
          placeholder="yourname"
          className="flex-1 min-w-0 px-4 py-3 text-sm bg-white outline-none text-gray-900 placeholder-gray-400"
        />
        <span
          className="flex-shrink-0 px-3 py-3 text-sm select-none border-l border-gray-200"
          style={{ backgroundColor: '#f9f9f9', color: '#E20074' }}
        >
          @tmobile.com
        </span>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  error?: string;
}

function PasswordField({ label, value, onChange, show, onToggle, error }: PasswordFieldProps) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1.5">{label}</label>
      <div
        className={`flex items-center border rounded-xl overflow-hidden transition-colors focus-within:border-[#E20074] ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
      >
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="••••••••"
          className="flex-1 min-w-0 px-4 py-3 text-sm bg-white outline-none text-gray-900 placeholder-gray-400"
        />
        <button
          type="button"
          onClick={onToggle}
          className="flex-shrink-0 px-3 text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

export function AdminLoginScreen({ onSuccess, onBack }: AdminLoginScreenProps) {
  const [tab, setTab] = useState<Tab>('login');

  // Login fields
  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPw,   setShowLoginPw]   = useState(false);
  const [loginErrors,   setLoginErrors]   = useState<{ email?: string; password?: string }>({});

  // Sign-up fields
  const [signupEmail,    setSignupEmail]    = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm,  setSignupConfirm]  = useState('');
  const [showSignupPw,   setShowSignupPw]   = useState(false);
  const [showConfirmPw,  setShowConfirmPw]  = useState(false);
  const [signupErrors,   setSignupErrors]   = useState<{ email?: string; password?: string; confirm?: string }>({});

  const handleLogin = () => {
    const errs: typeof loginErrors = {};
    if (!loginEmail.trim())    errs.email    = 'Please enter your email prefix.';
    if (!loginPassword.trim()) errs.password = 'Please enter your password.';
    setLoginErrors(errs);
    if (Object.keys(errs).length) return;
    onSuccess();
  };

  const handleSignup = () => {
    const errs: typeof signupErrors = {};
    if (!signupEmail.trim())                  errs.email    = 'Please enter your email prefix.';
    if (!signupPassword.trim())               errs.password = 'Please enter a password.';
    else if (signupPassword.length < 8)       errs.password = 'Password must be at least 8 characters.';
    if (!signupConfirm.trim())                errs.confirm  = 'Please confirm your password.';
    else if (signupConfirm !== signupPassword) errs.confirm  = 'Passwords do not match.';
    setSignupErrors(errs);
    if (Object.keys(errs).length) return;
    onSuccess();
  };

  return (
    <div className="h-full w-full bg-gray-50 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">

        {/* Back button */}
        <div className="px-8 pt-6 pb-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Branding */}
        <div className="px-8 pt-6 pb-4 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: '#E20074' }}
          >
            {/* Shield icon drawn with CSS to signal admin */}
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-2xl text-gray-900 mb-1">Admin Portal</h1>
          <p className="text-sm text-gray-400">Sign in with your T-Mobile admin credentials</p>
        </div>

        {/* Tab pills */}
        <div className="px-8 pb-8">
          <div className="flex gap-2 mb-6">
            {(['login', 'signup'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-full border text-sm transition-colors"
                style={
                  tab === t
                    ? { backgroundColor: '#000', borderColor: '#000', color: '#fff' }
                    : { backgroundColor: '#fff', borderColor: '#000', color: '#000' }
                }
              >
                {t === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Login form */}
          {tab === 'login' && (
            <div className="space-y-5">
              <EmailField
                value={loginEmail}
                onChange={v => { setLoginEmail(v); setLoginErrors(p => ({ ...p, email: undefined })); }}
                error={loginErrors.email}
              />
              <PasswordField
                label="Password"
                value={loginPassword}
                onChange={v => { setLoginPassword(v); setLoginErrors(p => ({ ...p, password: undefined })); }}
                show={showLoginPw}
                onToggle={() => setShowLoginPw(p => !p)}
                error={loginErrors.password}
              />
              <button
                onClick={handleLogin}
                className="w-full py-3.5 rounded-full text-white text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#E20074' }}
              >
                Log In
              </button>
            </div>
          )}

          {/* Sign-up form */}
          {tab === 'signup' && (
            <div className="space-y-5">
              <EmailField
                value={signupEmail}
                onChange={v => { setSignupEmail(v); setSignupErrors(p => ({ ...p, email: undefined })); }}
                error={signupErrors.email}
              />
              <PasswordField
                label="Password"
                value={signupPassword}
                onChange={v => { setSignupPassword(v); setSignupErrors(p => ({ ...p, password: undefined })); }}
                show={showSignupPw}
                onToggle={() => setShowSignupPw(p => !p)}
                error={signupErrors.password}
              />
              <PasswordField
                label="Confirm Password"
                value={signupConfirm}
                onChange={v => { setSignupConfirm(v); setSignupErrors(p => ({ ...p, confirm: undefined })); }}
                show={showConfirmPw}
                onToggle={() => setShowConfirmPw(p => !p)}
                error={signupErrors.confirm}
              />
              <button
                onClick={handleSignup}
                className="w-full py-3.5 rounded-full text-white text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#E20074' }}
              >
                Create Account
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
