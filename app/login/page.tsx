'use client';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { setAuth, getPostLoginRedirect, AuthContext, clearAuth } from '@/lib/auth';
import { getApiError } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { GraduationCap, Eye, EyeOff, Shield, ArrowRight, Sparkles } from 'lucide-react';

const DEMO = [
  { label: 'Super Admin',     email: 'admin@seeron.com',          pass: 'Admin@123',    badge: 'bg-amber-100 text-amber-700 border border-amber-200' },
  { label: 'Inst Admin',      email: 'iadmin@seeron.com',         pass: 'Admin@123',    badge: 'bg-red-100 text-red-700 border border-red-200' },
  { label: 'Principal',       email: 'principal@seeron.com',      pass: 'Admin@123',    badge: 'bg-purple-100 text-purple-700 border border-purple-200' },
  { label: 'Teacher',         email: 'john.smith@seeron.com',     pass: 'Teacher@123',  badge: 'bg-blue-100 text-blue-700 border border-blue-200' },
  { label: 'Accountant',      email: 'accountant@seeron.com',     pass: 'Admin@123',    badge: 'bg-green-100 text-green-700 border border-green-200' },
  { label: 'HR Manager',      email: 'hr@seeron.com',             pass: 'Admin@123',    badge: 'bg-pink-100 text-pink-700 border border-pink-200' },
  { label: 'Librarian',       email: 'librarian@seeron.com',      pass: 'Admin@123',    badge: 'bg-cyan-100 text-cyan-700 border border-cyan-200' },
  { label: 'Hostel Warden',   email: 'hostelwarden@seeron.com',   pass: 'Admin@123',    badge: 'bg-teal-100 text-teal-700 border border-teal-200' },
  { label: 'Transport Admin', email: 'transport@seeron.com',      pass: 'Admin@123',    badge: 'bg-violet-100 text-violet-700 border border-violet-200' },
  { label: 'Student',         email: 'alice@seeron.com',          pass: 'Student@123',  badge: 'bg-indigo-100 text-indigo-700 border border-indigo-200' },
];

const FEATURES = [
  'Multi-role Permission System',
  'Real-time Attendance Tracking',
  'Fee Management & Receipts',
  'Academic Performance Analytics',
  'Library & Hostel Management',
  'Transport Route Tracking',
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [featureIdx, setFeatureIdx] = useState(0);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setFeatureIdx(i => (i + 1) % FEATURES.length), 2500);
    return () => clearInterval(t);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const {
        accessToken, refreshToken, user, memberships,
        currentInstitute, currentMembershipId, currentRoles, currentPermissions,
      } = data.data;
      // Clear any stale auth data before storing new context
      clearAuth();
      const ctx: AuthContext = {
        user, memberships, currentInstitute,
        currentMembershipId, currentRoles, currentPermissions,
      };
      setAuth(accessToken, refreshToken, ctx);
      toast.success(`Welcome back, ${user.name}!`);
      router.push(getPostLoginRedirect(ctx));
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Animated blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-300/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        {/* Logo */}
        <div className={`relative transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Seeron</h1>
              <p className="text-indigo-200 text-sm">Institute Management</p>
            </div>
          </div>
        </div>

        {/* Main copy */}
        <div className={`relative space-y-6 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Manage your institute<br />
              <span className="text-indigo-200">smarter, not harder.</span>
            </h2>
            <p className="text-indigo-200 mt-3 text-lg">
              A complete platform for schools, colleges and universities.
            </p>
          </div>

          {/* Rotating feature pill */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-300 flex-shrink-0" />
            <div className="bg-white/10 backdrop-blur rounded-full px-4 py-2 text-sm text-white font-medium transition-all duration-500 min-h-[36px] flex items-center">
              {FEATURES[featureIdx]}
            </div>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-2">
            {FEATURES.map((f, i) => (
              <div key={f} className={`flex items-center gap-2 text-sm transition-all duration-300 ${i === featureIdx ? 'text-white' : 'text-indigo-300'}`}>
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all ${i === featureIdx ? 'bg-yellow-300 scale-150' : 'bg-indigo-400'}`} />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-indigo-300 text-xs">
          © 2025 Seeron • Multi-tenant Institute Management Platform
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className={`w-full max-w-md transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Seeron</h1>
            <p className="text-gray-500 text-sm mt-1">Institute Management System</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Card header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
              <h2 className="text-xl font-bold text-white">Welcome back</h2>
              <p className="text-indigo-200 text-sm mt-1">Sign in to continue to your dashboard</p>
            </div>

            {/* Form */}
            <div className="px-8 py-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                />
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <>Sign In <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              {/* Demo accounts */}
              <div className="mt-6">
                <button
                  onClick={() => setShowDemo(v => !v)}
                  className="w-full flex items-center justify-between text-sm text-gray-500 hover:text-gray-700 transition-colors py-2 border-t border-gray-100"
                >
                  <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Demo accounts</span>
                  <span className={`transition-transform duration-200 ${showDemo ? 'rotate-180' : ''}`}>▾</span>
                </button>

                <div className={`overflow-hidden transition-all duration-300 ${showDemo ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="pt-2 grid grid-cols-2 gap-1.5 max-h-72 overflow-y-auto">
                    {DEMO.map(d => (
                      <button
                        key={d.email}
                        type="button"
                        onClick={() => { setEmail(d.email); setPassword(d.pass); setShowDemo(false); }}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group text-left"
                      >
                        <span className={`font-semibold px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${d.badge}`}>{d.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Secured with JWT authentication & role-based access control
          </p>
        </div>
      </div>
    </div>
  );
}
