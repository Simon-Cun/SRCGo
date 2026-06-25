import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Switch from '@/components/ui/Switch';
import { useAuth } from '@/context/AuthContext';
import { STORAGE_KEYS } from '@/utils/constants';

const loadSavedUsername = (): string => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    if (raw) {
      const creds = JSON.parse(raw) as { username?: string };
      return creds.username ?? '';
    }
  } catch {
    // ignore
  }
  return '';
};

const LoginPage = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(loadSavedUsername);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 300);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = await auth.login(username.trim(), password, rememberMe);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      triggerShake();
      setError(result.error ?? 'Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-2/5 xl:w-1/2 bg-gradient-to-b from-primary-blue-dark to-primary-blue flex-col items-center justify-center px-12 py-16">
        <div className="text-center animate-fade-slide-up">
          <h1 className="text-6xl font-bold text-primary-gold tracking-wide">SRCGo</h1>
          <p className="text-xl text-white/85 mt-4">UCR Recreation Center</p>
          <p className="text-white/50 text-sm mt-8 leading-relaxed max-w-xs mx-auto">
            Access your membership barcode from any device — no app required.
          </p>
        </div>
      </div>

      {/* Right form panel (full screen on mobile) */}
      <div className="flex-1 bg-gradient-to-b from-primary-blue-dark to-primary-blue lg:bg-none lg:bg-neutral-gray100 flex flex-col items-center justify-center px-xl py-2xl">
        {/* Mobile-only branding */}
        <div className="lg:hidden text-center mb-2xl animate-fade-slide-up">
          <h1 className="text-4xl font-bold text-primary-gold tracking-wide">SRCGo</h1>
          <p className="text-lg text-white/90 mt-sm">UCR Recreation Center</p>
        </div>

        <div className={`w-full max-w-sm animate-fade-slide-up ${shaking ? 'animate-shake' : ''}`}>
          {/* Desktop heading above card */}
          <div className="hidden lg:block mb-lg">
            <h2 className="text-2xl font-bold text-neutral-gray800">Sign in</h2>
            <p className="text-sm text-neutral-gray500 mt-1">Use your UCR NetID credentials</p>
          </div>

          <Card variant="premium" className="p-xl">
            <form onSubmit={handleLogin} noValidate>
              <Input
                label="UCR NetID"
                type="text"
                placeholder="Enter your NetID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="username"
                disabled={auth.isLoading}
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={auth.isLoading}
              />

              <div className="mt-sm mb-md">
                <Switch
                  label="Remember me"
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  disabled={auth.isLoading}
                />
              </div>

              {error && (
                <div className="bg-semantic-error-light px-md py-sm rounded-md mb-md">
                  <p className="text-semantic-error text-sm text-center" role="alert">
                    {error}
                  </p>
                </div>
              )}

              <Button
                title="Sign In"
                type="submit"
                isLoading={auth.isLoading}
                disabled={!username.trim() || !password || auth.isLoading}
              />
            </form>
          </Card>
        </div>

        <p className="text-white/50 lg:text-neutral-gray500 text-xs mt-xl text-center">
          Use your UCR NetID credentials
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
