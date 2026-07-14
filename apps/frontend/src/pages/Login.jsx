import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../stores/authStore';
import useSettingsStore from '../stores/settingsStore';
import useThemeStore from '../stores/themeStore';
import { authApi } from '../api/auth';
import { Loader2, Eye, EyeOff, Store, Globe, Sun, Moon } from 'lucide-react';

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();
  const { theme, toggleTheme } = useThemeStore();
  const storeName = settings?.storeName || t('store_name');
  const storeLogo = settings?.storeLogo || null;
  const isRtl = i18n.language === 'ar';

  useEffect(() => {
    if (!settings) fetchSettings();
  }, [fetchSettings, settings]);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const toggleLanguage = useCallback(() => {
    const newLang = i18n.language === 'fr' ? 'ar' : 'fr';
    i18n.changeLanguage(newLang);
  }, [i18n]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authApi.login(phone, password);
      login(res.data.user, res.data.accessToken);

      if (res.data.user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/pos', { replace: true });
      }
    } catch (err) {
      setError(err.message || t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-blue-600/8 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full bg-cyan-600/6 blur-[100px]" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] rounded-full bg-indigo-600/5 blur-[80px]" />
      </div>

      {/* Top buttons */}
      <div className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} z-20 flex items-center gap-2`}>
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface/50 border border-surface-border text-muted-foreground hover:text-text-primary hover:bg-surface transition-all text-sm backdrop-blur-sm"
        >
          <Globe className="w-4 h-4" />
          {isRtl ? 'FR' : 'ع'}
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-surface/50 border border-surface-border text-muted-foreground hover:text-text-primary hover:bg-surface transition-all backdrop-blur-sm"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-[420px] mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          {storeLogo ? (
            <img src={storeLogo} alt={storeName} className="w-16 h-16 rounded-2xl object-cover mx-auto mb-5 shadow-xl" />
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 mb-5 shadow-xl shadow-blue-500/25">
              <Store className="w-8 h-8 text-white" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            {storeName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('login.subtitle')}
          </p>
        </div>

        {/* Login card */}
        <div className="bg-card/80 backdrop-blur-2xl rounded-3xl border border-surface-border p-8 shadow-2xl">
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('phone')}
              </label>
              <div className="flex items-center rounded-xl border border-[var(--input)] bg-surface overflow-hidden focus-within:border-[hsl(var(--ring))] focus-within:shadow-[0_0_0_2px_hsl(var(--ring)/0.15)] transition-all">
                <span className="flex items-center gap-1 px-3 text-sm font-medium text-muted-foreground border-r border-[var(--input)] bg-accent/50 shrink-0 h-full min-h-[44px]">
                  +222
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="33 44 55 66"
                  required
                  className="!border-0 !rounded-none !ring-0 !shadow-none bg-transparent px-3 py-3 flex-1 min-w-0"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 ${isRtl ? 'left-0' : 'right-0'} flex items-center px-3 text-muted-foreground hover:text-text-primary transition-colors`}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t('login.action')
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {storeName} &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
