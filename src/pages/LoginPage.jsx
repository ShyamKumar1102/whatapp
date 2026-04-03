import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Input }  from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label }  from '@/components/ui/label';
import { useStore } from '@/store/useStore';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function LoginPage() {
  const navigate  = useNavigate();
  const { login } = useStore();

  const location = useLocation();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const registered = location.state?.registered;
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [showForgot, setShowForgot]     = useState(false);
  const [forgotEmail, setForgotEmail]   = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg]       = useState(null); // { type: 'success'|'error', text }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      if (data.success) {
        navigate('/');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch {
      setError('Server error — make sure the backend is running');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg(null);
    try {
      const res  = await fetch(`${BACKEND}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setForgotMsg({ type: 'success', text: `Your new temporary password: ${data.tempPassword}` });
      } else {
        setForgotMsg({ type: 'error', text: data.message || 'Email not found' });
      }
    } catch {
      setForgotMsg({ type: 'error', text: 'Server error — make sure the backend is running' });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
            <MessageCircle className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">CRM Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        {!showForgot ? (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="admin@crm.com"
              className="mt-1.5"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button type="button" onClick={() => { setShowForgot(true); setForgotMsg(null); setForgotEmail(''); }} className="text-xs text-primary hover:underline">
                Forgot password?
              </button>
            </div>
            <div className="relative mt-1.5">
              <Input
                id="password"
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {registered && (
            <p className="text-xs text-primary bg-primary/10 px-3 py-2 rounded-lg">✅ Account created! Sign in below.</p>
          )}
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <p className="text-xs text-center text-muted-foreground pt-1">
            Contact your admin for credentials
          </p>
        </form>
        ) : (
        <form onSubmit={handleForgotSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Reset Password</h2>
            <p className="text-xs text-muted-foreground mt-1">Enter your email to receive a temporary password.</p>
          </div>
          <div>
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              placeholder="admin@crm.com"
              className="mt-1.5"
              required
              autoFocus
            />
          </div>

          {forgotMsg && (
            <p className={`text-xs px-3 py-2 rounded-lg ${
              forgotMsg.type === 'success'
                ? 'text-primary bg-primary/10'
                : 'text-destructive bg-destructive/10'
            }`}>
              {forgotMsg.type === 'success' ? '✅ ' : '❌ '}{forgotMsg.text}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={forgotLoading}>
            {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {forgotLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
          <button type="button" onClick={() => setShowForgot(false)} className="w-full text-xs text-center text-muted-foreground hover:text-foreground">
            ← Back to Sign In
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
